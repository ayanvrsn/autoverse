async function applyFilters() {
    const brand = document.getElementById('brandFilter').value;
    const maxPrice = document.getElementById('maxPrice').value;

    let url = `/api/cars?`;
    if (brand) url += `brand=${brand}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}`;

    try {
        const response = await fetch(url);
        const cars = await response.json();
        renderCars(cars);
    } catch (error) {
        console.error("Ошибка загрузки:", error);
    }
}

function renderCars(cars) {
    const container = document.getElementById('car-list');
    
    if (cars.length === 0) {
        container.innerHTML = "<p>Машины не найдены</p>";
        return;
    }

    container.innerHTML = cars.map(car => `
        <div class="car-card">
            <img src="${car.image || 'https://via.placeholder.com/200x120'}" alt="${car.model}" style="width:100%">
            <h3>${car.brand} ${car.model}</h3>
            <p>Базовая цена: <strong>$${car.basePrice}</strong></p>
            <a href="product.html?id=${car._id}" class="btn-detail">Конфигурировать</a>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', applyFilters);