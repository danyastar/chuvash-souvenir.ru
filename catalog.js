const filterBtn = document.getElementById("filterBtn");
const categoryFilter = document.getElementById("categoryFilter");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");
const products = document.querySelectorAll(".card");
const productsPerPage = 12;


let currentPage = 1;

function showPage(page) {
    currentPage = page;
    const start = (page - 1) * productsPerPage;
    const end = start + productsPerPage;

    products.forEach((product, index) => {
        product.style.display = index >= start && index < end ? "block" : "none";
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(products.length / productsPerPage);
    const pagination = document.getElementById("pagination");

    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.classList.toggle("active", i === currentPage);
        btn.addEventListener("click", () => showPage(i));
        pagination.appendChild(btn);
    }
}

showPage(1);

filterBtn.addEventListener("click", () => {
    const category = categoryFilter.value;
    const min = priceMin.value ? parseInt(priceMin.value) : 0;
    const max = priceMax.value ? parseInt(priceMax.value) : Infinity;

    products.forEach(product => {
        const prodCategory = product.dataset.category;
        const prodPrice = parseInt(product.dataset.price);

        const categoryMatch = category === "all" || prodCategory === category;
        const priceMatch = prodPrice >= min && prodPrice <= max;

        product.style.display = (categoryMatch && priceMatch) ? "block" : "none";
    });
});

document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
        alert("Товар добавлен в корзину!");
    });
});

