const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
    const client = new Client({ connectionString: 'postgres://postgres:0000@localhost:5432/user_db' });
    await client.connect();

    console.log('Хэшируем пароль...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const TOTAL_USERS = 499989;
    const BATCH_SIZE = 5000;

    console.log(`Начинаем генерацию ${TOTAL_USERS} пользователей с распределением ролей...`);

    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
        let values = [];
        let queryValues = [];
        
        let currentBatch = Math.min(BATCH_SIZE, TOTAL_USERS - i);
        for (let j = 0; j < currentBatch; j++) {
            let index = i + j;
            
            // ЛОГИКА РОЛЕЙ:
            // 1% - админы (role_id 1), 9% - продавцы (role_id 4), 90% - покупатели (role_id 2)
            let random = Math.random();
            let roleId = 2; // по умолчанию покупатель
            if (random < 0.01) roleId = 1;      // 1% админы
            else if (random < 0.10) roleId = 4; // 9% продавцы (0.01 + 0.09 = 0.10)

            let offset = j * 4;
            queryValues.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, NOW())`);
            values.push(`user_${index}`, `user_${index}@example.com`, hashedPassword, roleId);
        }

        const query = `INSERT INTO public.users (username, email, password_hash, role_id, created_at) VALUES ${queryValues.join(',')}`;
        
        await client.query(query, values);
        console.log(`Вставлено ${i + currentBatch} из ${TOTAL_USERS}...`);
    }

    console.log('Готово! Пользователи с разными ролями созданы.');
    await client.end();
}

seed().catch(console.error);