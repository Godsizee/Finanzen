import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-finanzen.dasdann.jetzt');

async function updateSchema() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@test.de', '*0K7j9l;3Oj%sMC+&mW*4');

        // 1. Update users collection
        const usersCollection = await pb.collections.getOne('users');
        const hasPartnerField = usersCollection.fields.some(field => field.name === 'partner');
        if (!hasPartnerField) {
            usersCollection.fields.push({
                name: "partner",
                type: "relation",
                required: false,
                presentable: false,
                unique: false,
                collectionId: usersCollection.id,
                cascadeDelete: false,
                minSelect: null,
                maxSelect: 1
            });
        }
        const hasIncomeField = usersCollection.fields.some(field => field.name === 'income');
        if (!hasIncomeField) {
            usersCollection.fields.push({
                name: "income",
                type: "number",
                required: false,
                presentable: false,
                unique: false,
                min: 0
            });
        }
        usersCollection.listRule = '@request.auth.id != ""';
        usersCollection.viewRule = '@request.auth.id != ""';
        usersCollection.updateRule = 'id = @request.auth.id || partner = @request.auth.id';
        
        await pb.collections.update('users', usersCollection);
        console.log('Users collection updated successfully.');

        // 2. Clear old transactions and settlements if any (to start fresh)
        try {
            console.log('Deleting transactions collection to recreate...');
            await pb.collections.delete('transactions');
        } catch (e) {
            console.log('transactions might not exist');
        }
        try {
            console.log('Deleting settlements collection to recreate...');
            await pb.collections.delete('settlements');
        } catch (e) {
            console.log('settlements might not exist');
        }

        // 3. Recreate settlements
        const settlementsCol = await pb.collections.create({
            name: 'settlements',
            type: 'base',
            fields: [
                { name: 'date', type: 'date', required: true },
                { name: 'amount', type: 'number', required: true },
                { name: 'created_by', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
                { name: 'settled_with', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true }
            ],
            listRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
            viewRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: 'created_by = @request.auth.id || settled_with = @request.auth.id',
            deleteRule: 'created_by = @request.auth.id || settled_with = @request.auth.id'
        });
        console.log('Settlements created');

        // 4. Recreate transactions
        const transactionsCol = await pb.collections.create({
            name: 'transactions',
            type: 'base',
            fields: [
                { name: 'total_amount', type: 'number', required: true },
                { name: 'date', type: 'date', required: true },
                { name: 'paid_amount_user_a', type: 'number', required: false },
                { name: 'paid_amount_user_b', type: 'number', required: false },
                { name: 'split_mode', type: 'text', required: true },
                { name: 'note', type: 'text', required: false },
                { name: 'paid_by', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
                { name: 'category', type: 'relation', collectionId: (await pb.collections.getOne('categories')).id, maxSelect: 1, required: false },
                { name: 'settlement_id', type: 'relation', collectionId: settlementsCol.id, maxSelect: 1, required: false },
                { name: 'metadata', type: 'json', required: false }
            ],
            listRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
            viewRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id',
            deleteRule: 'paid_by = @request.auth.id || paid_by.partner = @request.auth.id'
        });
        console.log('Transactions created');
    } catch (err) {
        console.error('Error:', err.response?.data?.fields || err.message);
    }
}

updateSchema();
