import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-finanzen.dasdann.jetzt');

async function run() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('admin@test.de', '*0K7j9l;3Oj%sMC+&mW*4');
        console.log('Authenticated.');

        const categories = await pb.collection('categories').getFullList();
        const users = await pb.collection('users').getFullList();

        if (users.length === 0 || categories.length === 0) {
            console.error('Need data.');
            return;
        }

        console.log('Creating a temporary rule...');
        const rule = await pb.collection('recurring_expenses').create({
            name: 'Temp Test Rule',
            amount: 1000,
            category: categories[0].id,
            paid_by: users[0].id,
            split_mode: '50_50',
            frequency: 'monthly',
            day_of_month: 1,
            start_date: '2026-04-01 12:00:00',
            active: true
        });
        console.log('Rule created:', rule.id);

        const formattedDate = '2026-05-15 12:00:00';
        console.log(`Trying to update last_generated on rule to: "${formattedDate}"...`);

        try {
            const updated = await pb.collection('recurring_expenses').update(rule.id, {
                last_generated: formattedDate
            });
            console.log('Update successful! last_generated is:', updated.last_generated);
        } catch (err) {
            console.error('Update failed:');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error(err);
            }
        }

        // Cleanup
        console.log('Cleaning up rule...');
        await pb.collection('recurring_expenses').delete(rule.id);
        console.log('Cleanup done.');

    } catch (err) {
        console.error('General Error:', err);
    }
}

run();
