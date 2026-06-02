const { Client } = require('pg');

async function seedProducts() {
    const client = new Client({ connectionString: 'postgres://postgres:0000@localhost:5432/user_db' });
    await client.connect();

    // 1. Получаем ID всех пользователей, у которых role_id = 4 (продавцы)
    console.log('Загрузка списка продавцов...');
    const sellersResult = await client.query('SELECT id FROM public.users WHERE role_id = 4');
    const sellerIds = sellersResult.rows.map(row => row.id);

    if (sellerIds.length === 0) {
        console.error('Ошибка: в базе не найдено ни одного продавца (role_id = 4)!');
        await client.end();
        return;
    }

    const TOTAL_PRODUCTS = 499991;
    const BATCH_SIZE = 5000;

    console.log(`Найдено ${sellerIds.length} продавцов. Генерируем ${TOTAL_PRODUCTS} товаров...`);

    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
        let values = [];
        let queryValues = [];
        let currentBatch = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);

        for (let j = 0; j < currentBatch; j++) {
            // 2. Случайный выбор продавца из массива
            let randomSellerId = sellerIds[Math.floor(Math.random() * sellerIds.length)];
            let offset = j * 6;

            queryValues.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
            values.push(
                `Товар #${i + j}`,
                `Описание крутого товара #${i + j}`,
                (Math.random() * 10000 + 500).toFixed(2),
                Math.floor(Math.random() * 100),
                randomSellerId, // теперь это случайный ID из базы
                new Date()
            );
        }

        const query = `INSERT INTO public.products (name, description, price, quantity, seller_id, created_at) VALUES ${queryValues.join(',')}`;
        await client.query(query, values);
        console.log(`Вставлено ${i + currentBatch} товаров...`);
    }

    console.log('Готово! Товары привязаны к случайным продавцам.');
    await client.end();
}

seedProducts().catch(console.error);