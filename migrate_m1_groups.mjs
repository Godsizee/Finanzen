import PocketBase from 'pocketbase';
import { randomBytes } from 'node:crypto';

/**
 * M1 — Multi-Tenant Foundation
 *
 * 1. Erstellt die Collections `groups` und `group_members`
 * 2. Fügt ein `group`-Relationsfeld zu transactions, settlements, recurring_expenses hinzu
 * 3. Migriert Bestandsdaten: Partner-Paare → gemeinsame Gruppe, Solo-User → eigene Gruppe,
 *    Backfill des `group`-Felds auf allen Datensätzen
 * 4. Setzt gruppenbasierte Row-Level-Regeln (ersetzt die alten partnerbasierten Regeln)
 *
 * Ausführen (VOR dem Deploy des neuen Frontends):
 *   PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node migrate_m1_groups.mjs
 */

const PB_URL = process.env.PB_URL || 'https://pocketbase-finanzen.dasdann.jetzt';
const pb = new PocketBase(PB_URL);

const inviteCode = () => randomBytes(6).toString('hex');

// Eine Membership-Prüfung als wiederverwendbarer Regel-Baustein:
// existiert ein group_members-Eintrag mit (group = <record.group>, user = <auth>)?
const memberRule =
	'@collection.group_members.group ?= group && @collection.group_members.user ?= @request.auth.id';
const groupDataRule = `@request.auth.id != "" && group != "" && ${memberRule}`;

async function ensureCollection(name, definition) {
	try {
		return await pb.collections.getOne(name);
	} catch {
		console.log(`Creating collection ${name}...`);
		return await pb.collections.create(definition);
	}
}

async function ensureField(collection, field) {
	if (collection.fields.some((f) => f.name === field.name)) return false;
	collection.fields.push(field);
	await pb.collections.update(collection.id, collection);
	console.log(`Added field ${field.name} to ${collection.name}.`);
	return true;
}

async function setRules(name, rules) {
	const col = await pb.collections.getOne(name);
	let changed = false;
	for (const [key, val] of Object.entries(rules)) {
		if (col[key] !== val) {
			col[key] = val;
			changed = true;
		}
	}
	if (changed) {
		await pb.collections.update(col.id, col);
		console.log(`Rules updated on ${name}.`);
	} else {
		console.log(`Rules on ${name} already up to date.`);
	}
}

async function main() {
	const adminEmail = process.env.PB_ADMIN_EMAIL;
	const adminPassword = process.env.PB_ADMIN_PASSWORD;
	if (!adminEmail || !adminPassword) {
		throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables are required.');
	}
	console.log(`Authenticating as admin (${PB_URL})...`);
	try {
		await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
	} catch {
		await pb.admins.authWithPassword(adminEmail, adminPassword);
	}

	const usersCollection = await pb.collections.getOne('users');

	// ── 1. groups ────────────────────────────────────────────────────────────
	const groups = await ensureCollection('groups', {
		name: 'groups',
		type: 'base',
		fields: [
			{ name: 'name', type: 'text', required: true },
			{ name: 'description', type: 'text', required: false },
			{
				name: 'created_by',
				type: 'relation',
				collectionId: usersCollection.id,
				maxSelect: 1,
				required: true
			},
			{ name: 'invite_code', type: 'text', required: false },
			{ name: 'default_split_mode', type: 'text', required: false },
			{ name: 'is_archived', type: 'bool', required: false }
		]
	});

	// ── 2. group_members ─────────────────────────────────────────────────────
	await ensureCollection('group_members', {
		name: 'group_members',
		type: 'base',
		fields: [
			{
				name: 'group',
				type: 'relation',
				collectionId: groups.id,
				maxSelect: 1,
				required: true,
				cascadeDelete: true
			},
			{
				name: 'user',
				type: 'relation',
				collectionId: usersCollection.id,
				maxSelect: 1,
				required: true,
				cascadeDelete: true
			},
			{
				name: 'role',
				type: 'select',
				maxSelect: 1,
				values: ['admin', 'member', 'readonly'],
				required: true
			},
			{ name: 'income', type: 'number', required: false, min: 0 },
			// Wird beim Beitritt per Einladungslink mitgesendet und in der
			// createRule gegen group.invite_code geprüft.
			{ name: 'invite_code', type: 'text', required: false },
			{ name: 'is_active', type: 'bool', required: false }
		],
		indexes: ['CREATE UNIQUE INDEX `idx_group_members_unique` ON `group_members` (`group`, `user`)']
	});

	// ── 3. group-Feld auf Datencollections ───────────────────────────────────
	const groupField = {
		name: 'group',
		type: 'relation',
		collectionId: groups.id,
		maxSelect: 1,
		required: false
	};
	for (const name of ['transactions', 'settlements', 'recurring_expenses']) {
		const col = await pb.collections.getOne(name);
		await ensureField(col, groupField);
	}

	// ── 4. Datenmigration ─────────────────────────────────────────────────────
	console.log('Migrating existing data into groups...');
	const users = await pb.collection('users').getFullList();
	const existingMemberships = await pb.collection('group_members').getFullList();
	const userToGroup = new Map(); // userId -> primary groupId
	for (const m of existingMemberships) {
		if (!userToGroup.has(m.user)) userToGroup.set(m.user, m.group);
	}

	const createGroupWithMembers = async (name, creator, members) => {
		const g = await pb.collection('groups').create({
			name,
			created_by: creator.id,
			invite_code: inviteCode(),
			default_split_mode: creator.cost_sharing_mode || '50_50'
		});
		for (const u of members) {
			await pb.collection('group_members').create({
				group: g.id,
				user: u.id,
				role: 'admin',
				income: u.income || 0,
				is_active: true
			});
			userToGroup.set(u.id, g.id);
		}
		console.log(`Created group "${name}" (${g.id}) with ${members.length} member(s).`);
		return g;
	};

	// 4a. Wechselseitige Partner-Paare → gemeinsame Gruppe
	const processed = new Set();
	for (const u of users) {
		if (processed.has(u.id) || userToGroup.has(u.id)) continue;
		const partner = u.partner ? users.find((x) => x.id === u.partner) : null;
		if (partner && partner.partner === u.id && !userToGroup.has(partner.id)) {
			await createGroupWithMembers('Gemeinsame Kasse', u, [u, partner]);
			processed.add(u.id);
			processed.add(partner.id);
		}
	}

	// 4b. Alle übrigen User → eigene Gruppe
	for (const u of users) {
		if (processed.has(u.id) || userToGroup.has(u.id)) continue;
		await createGroupWithMembers('Meine Kasse', u, [u]);
		processed.add(u.id);
	}

	// 4c. Backfill group auf Bestandsdaten
	const backfill = async (collectionName, ownerField) => {
		const records = await pb.collection(collectionName).getFullList({ filter: 'group = ""' });
		let count = 0;
		for (const r of records) {
			const gid = userToGroup.get(r[ownerField]);
			if (!gid) {
				console.warn(`No group for ${collectionName}/${r.id} (owner ${r[ownerField]}) — skipped.`);
				continue;
			}
			await pb.collection(collectionName).update(r.id, { group: gid });
			count++;
		}
		console.log(`Backfilled ${count}/${records.length} records in ${collectionName}.`);
	};
	await backfill('transactions', 'paid_by');
	await backfill('settlements', 'created_by');
	await backfill('recurring_expenses', 'paid_by');

	// ── 5. Regeln setzen (nach dem Backfill!) ─────────────────────────────────
	await setRules('groups', {
		listRule:
			'@request.auth.id != "" && @collection.group_members.group ?= id && @collection.group_members.user ?= @request.auth.id',
		// view bewusst offener: für die Einladungs-Vorschau (Gruppenname) per Link
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != "" && created_by = @request.auth.id',
		updateRule:
			'@request.auth.id != "" && @collection.group_members.group ?= id && @collection.group_members.user ?= @request.auth.id && @collection.group_members.role ?= "admin"',
		deleteRule:
			'@request.auth.id != "" && @collection.group_members.group ?= id && @collection.group_members.user ?= @request.auth.id && @collection.group_members.role ?= "admin"'
	});

	await setRules('group_members', {
		listRule:
			'@request.auth.id != "" && (user = @request.auth.id || (@collection.group_members:me.group ?= group && @collection.group_members:me.user ?= @request.auth.id))',
		viewRule:
			'@request.auth.id != "" && (user = @request.auth.id || (@collection.group_members:me.group ?= group && @collection.group_members:me.user ?= @request.auth.id))',
		// Erlaubt: (a) Ersteller fügt sich als Admin hinzu, (b) Selbst-Beitritt mit
		// gültigem Einladungscode, (c) Gruppen-Admin fügt weitere Mitglieder hinzu
		createRule:
			'@request.auth.id != "" && ((user = @request.auth.id && group.created_by = @request.auth.id && role = "admin") || (user = @request.auth.id && role = "member" && group.invite_code != "" && invite_code = group.invite_code) || (@collection.group_members:adm.group ?= group && @collection.group_members:adm.user ?= @request.auth.id && @collection.group_members:adm.role ?= "admin"))',
		updateRule:
			'@request.auth.id != "" && (user = @request.auth.id || (@collection.group_members:adm.group ?= group && @collection.group_members:adm.user ?= @request.auth.id && @collection.group_members:adm.role ?= "admin"))',
		deleteRule:
			'@request.auth.id != "" && (user = @request.auth.id || (@collection.group_members:adm.group ?= group && @collection.group_members:adm.user ?= @request.auth.id && @collection.group_members:adm.role ?= "admin"))'
	});

	for (const name of ['transactions', 'settlements', 'recurring_expenses']) {
		await setRules(name, {
			listRule: groupDataRule,
			viewRule: groupDataRule,
			createRule: groupDataRule,
			updateRule: groupDataRule,
			deleteRule: groupDataRule
		});
	}

	// users: Sichtbarkeit auf Mitglieder gemeinsamer Gruppen erweitern
	// (nötig, damit expand=user in group_members Namen liefert)
	const userVisibility =
		'id = @request.auth.id || partner = @request.auth.id || (@collection.group_members:me.user ?= @request.auth.id && @collection.group_members:other.user ?= id && @collection.group_members:other.group ?= @collection.group_members:me.group)';
	await setRules('users', {
		listRule: userVisibility,
		viewRule: userVisibility
	});

	console.log('M1 migration completed successfully.');
}

main().catch((err) => {
	console.error('Migration failed:', err.response?.data || err.message || err);
	process.exit(1);
});
