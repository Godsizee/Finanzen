import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-finanzen.dasdann.jetzt');

async function updateSchema() {
	try {
		const adminEmail = process.env.PB_ADMIN_EMAIL;
		const adminPassword = process.env.PB_ADMIN_PASSWORD;
		if (!adminEmail || !adminPassword) {
			throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables are required.');
		}
		console.log('Authenticating as admin...');
		await pb.admins.authWithPassword(adminEmail, adminPassword);

		// 1. Update users collection (Fields & Rules)
		console.log('Checking users collection...');
		const usersCollection = await pb.collections.getOne('users');
		let usersUpdated = false;

		const hasPartnerField = usersCollection.fields.some((field) => field.name === 'partner');
		if (!hasPartnerField) {
			usersCollection.fields.push({
				name: 'partner',
				type: 'relation',
				required: false,
				presentable: false,
				unique: false,
				collectionId: usersCollection.id,
				cascadeDelete: false,
				minSelect: null,
				maxSelect: 1
			});
			usersUpdated = true;
		}
		const hasIncomeField = usersCollection.fields.some((field) => field.name === 'income');
		if (!hasIncomeField) {
			usersCollection.fields.push({
				name: 'income',
				type: 'number',
				required: false,
				presentable: false,
				unique: false,
				min: 0
			});
			usersUpdated = true;
		}

		const hasOnboardedField = usersCollection.fields.some((field) => field.name === 'onboarded');
		if (!hasOnboardedField) {
			usersCollection.fields.push({
				name: 'onboarded',
				type: 'bool',
				required: false
			});
			usersUpdated = true;
		}

		const usersRules = {
			listRule: 'id = @request.auth.id || partner = @request.auth.id',
			viewRule: 'id = @request.auth.id || partner = @request.auth.id',
			updateRule: 'id = @request.auth.id || partner = @request.auth.id',
			deleteRule: 'id = @request.auth.id'
		};

		for (const [key, val] of Object.entries(usersRules)) {
			if (usersCollection[key] !== val) {
				usersCollection[key] = val;
				usersUpdated = true;
			}
		}

		if (usersUpdated) {
			await pb.collections.update('users', usersCollection);
			console.log('Users collection updated successfully.');
		} else {
			console.log('Users collection is already up to date.');
		}

		// 2. Update categories collection
		console.log('Checking categories collection...');
		try {
			const categoriesCollection = await pb.collections.getOne('categories');
			let catUpdated = false;
			const catRules = {
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""'
			};
			for (const [key, val] of Object.entries(catRules)) {
				if (categoriesCollection[key] !== val) {
					categoriesCollection[key] = val;
					catUpdated = true;
				}
			}
			if (catUpdated) {
				await pb.collections.update('categories', categoriesCollection);
				console.log('Categories rules updated successfully.');
			} else {
				console.log('Categories collection is already up to date.');
			}
		} catch (err) {
			console.error('Error updating categories:', err.message);
		}

		// 3. Update/Create settlements collection
		console.log('Checking settlements collection...');
		try {
			const settlementsCollection = await pb.collections.getOne('settlements');
			let setUpdated = false;
			const setRules = {
				listRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				viewRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				createRule:
					'@request.auth.id != "" && created_by = @request.auth.id && settled_with = @request.auth.partner',
				updateRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				deleteRule: 'created_by = @request.auth.id || settled_with = @request.auth.id'
			};
			for (const [key, val] of Object.entries(setRules)) {
				if (settlementsCollection[key] !== val) {
					settlementsCollection[key] = val;
					setUpdated = true;
				}
			}

			const requiredFields = [
				{ name: 'status', type: 'text', required: false },
				{ name: 'payer', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
				{ name: 'receiver', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
				{ name: 'split_mode', type: 'text', required: false },
				{ name: 'details', type: 'json', required: false }
			];

			for (const field of requiredFields) {
				const hasField = settlementsCollection.fields.some((f) => f.name === field.name);
				if (!hasField) {
					settlementsCollection.fields.push(field);
					setUpdated = true;
				}
			}

			if (setUpdated) {
				await pb.collections.update('settlements', settlementsCollection);
				console.log('Settlements updated successfully.');
			} else {
				console.log('Settlements collection is already up to date.');
			}
		} catch (err) {
			console.log('Settlements collection does not exist, creating...');
			await pb.collections.create({
				name: 'settlements',
				type: 'base',
				fields: [
					{ name: 'date', type: 'date', required: true },
					{ name: 'amount', type: 'number', required: true },
					{
						name: 'created_by',
						type: 'relation',
						collectionId: usersCollection.id,
						maxSelect: 1,
						required: true
					},
					{
						name: 'settled_with',
						type: 'relation',
						collectionId: usersCollection.id,
						maxSelect: 1,
						required: true
					},
					{ name: 'status', type: 'text', required: false },
					{ name: 'payer', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
					{ name: 'receiver', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
					{ name: 'split_mode', type: 'text', required: false },
					{ name: 'details', type: 'json', required: false }
				],
				listRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				viewRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				createRule:
					'@request.auth.id != "" && created_by = @request.auth.id && settled_with = @request.auth.partner',
				updateRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
				deleteRule: 'created_by = @request.auth.id || settled_with = @request.auth.id'
			});
			console.log('Settlements created.');
		}

		// 4. Update/Create transactions collection
		console.log('Checking transactions collection...');
		const categoriesId = (await pb.collections.getOne('categories')).id;
		const settlementsId = (await pb.collections.getOne('settlements')).id;
		try {
			const transactionsCollection = await pb.collections.getOne('transactions');
			let txUpdated = false;
			const txRules = {
				listRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				viewRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				createRule:
					'@request.auth.id != "" && (paid_by = @request.auth.id || paid_by = @request.auth.partner)',
				updateRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				deleteRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id'
			};
			for (const [key, val] of Object.entries(txRules)) {
				if (transactionsCollection[key] !== val) {
					transactionsCollection[key] = val;
					txUpdated = true;
				}
			}
			if (txUpdated) {
				await pb.collections.update('transactions', transactionsCollection);
				console.log('Transactions rules updated successfully.');
			} else {
				console.log('Transactions collection is already up to date.');
			}
		} catch (err) {
			console.log('Transactions collection does not exist, creating...');
			await pb.collections.create({
				name: 'transactions',
				type: 'base',
				fields: [
					{ name: 'total_amount', type: 'number', required: true },
					{ name: 'date', type: 'date', required: true },
					{ name: 'paid_amount_user_a', type: 'number', required: false },
					{ name: 'paid_amount_user_b', type: 'number', required: false },
					{ name: 'split_mode', type: 'text', required: true },
					{ name: 'note', type: 'text', required: false },
					{
						name: 'paid_by',
						type: 'relation',
						collectionId: usersCollection.id,
						maxSelect: 1,
						required: true
					},
					{
						name: 'category',
						type: 'relation',
						collectionId: categoriesId,
						maxSelect: 1,
						required: false
					},
					{
						name: 'settlement_id',
						type: 'relation',
						collectionId: settlementsId,
						maxSelect: 1,
						required: false
					},
					{ name: 'metadata', type: 'json', required: false }
				],
				listRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				viewRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				createRule:
					'@request.auth.id != "" && (paid_by = @request.auth.id || paid_by = @request.auth.partner)',
				updateRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				deleteRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id'
			});
			console.log('Transactions created.');
		}

		// 5. Update/Create recurring_expenses collection
		console.log('Checking recurring_expenses collection...');
		try {
			const recurringCollection = await pb.collections.getOne('recurring_expenses');
			let recUpdated = false;
			const recRules = {
				listRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				viewRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				createRule:
					'@request.auth.id != "" && (paid_by = @request.auth.id || paid_by = @request.auth.partner)',
				updateRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				deleteRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id'
			};
			for (const [key, val] of Object.entries(recRules)) {
				if (recurringCollection[key] !== val) {
					recurringCollection[key] = val;
					recUpdated = true;
				}
			}
			if (recUpdated) {
				await pb.collections.update('recurring_expenses', recurringCollection);
				console.log('Recurring expenses rules updated successfully.');
			} else {
				console.log('Recurring expenses collection is already up to date.');
			}
		} catch (err) {
			console.log('Recurring expenses collection does not exist, creating...');
			await pb.collections.create({
				name: 'recurring_expenses',
				type: 'base',
				fields: [
					{ name: 'name', type: 'text', required: true },
					{ name: 'amount', type: 'number', required: true },
					{
						name: 'category',
						type: 'relation',
						collectionId: categoriesId,
						maxSelect: 1,
						required: true
					},
					{
						name: 'paid_by',
						type: 'relation',
						collectionId: usersCollection.id,
						maxSelect: 1,
						required: true
					},
					{ name: 'split_mode', type: 'text', required: true },
					{ name: 'frequency', type: 'text', required: true },
					{ name: 'day_of_month', type: 'number', required: true },
					{ name: 'start_date', type: 'date', required: true },
					{ name: 'last_generated', type: 'date', required: false },
					{ name: 'active', type: 'bool', required: true }
				],
				listRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				viewRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				createRule:
					'@request.auth.id != "" && (paid_by = @request.auth.id || paid_by = @request.auth.partner)',
				updateRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
				deleteRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id'
			});
			console.log('Recurring expenses created.');
		}
	} catch (err) {
		console.error('Error:', err.response?.data?.fields || err.message);
	}
}

updateSchema();
