import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-finanzen.dasdann.jetzt');

async function run() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('admin@test.de', '*0K7j9l;3Oj%sMC+&mW*4');
        console.log('Authenticated.');

        const list = await pb.collection('recurring_expenses').getFullList();
        console.log('Recurring Expenses in DB:');
        console.log(JSON.stringify(list, null, 2));

        const users = await pb.collection('users').getFullList();
        console.log('Users in DB:');
        for (const u of users) {
            console.log(`- ${u.username || u.email} (ID: ${u.id})`);
        }

        const categories = await pb.collection('categories').getFullList();
        console.log('Categories in DB:');
        for (const c of categories) {
            console.log(`- ${c.name} (ID: ${c.id})`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
