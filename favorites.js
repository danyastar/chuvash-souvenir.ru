// favorites.js
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const db = getFirestore();
const auth = getAuth();

let currentUser = null;
let localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Слушаем изменения входа/выхода
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        // При входе — синхронизируем локальные избранные с Firebase
        await syncLocalToFirebase();
        await loadFirebaseFavorites();
    } else {
        // При выходе — сохраняем избранное в localStorage
        localStorage.setItem('favorites', JSON.stringify(localFavorites));
    }
});

// Добавить в избранное
export async function addToFavorites(productId, productName) {
    if (currentUser) {
        const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', productId);
        await setDoc(favoriteRef, {
            id: productId,
            name: productName,
            addedAt: new Date()
        });
        await loadFirebaseFavorites();
    } else {
        if (!localFavorites.includes(productId)) {
            localFavorites.push(productId);
            localStorage.setItem('favorites', JSON.stringify(localFavorites));
        }
    }
    updateFavoriteButtons();
}

// Удалить из избранного
export async function removeFromFavorites(productId) {
    if (currentUser) {
        const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', productId);
        await deleteDoc(favoriteRef);
        await loadFirebaseFavorites();
    } else {
        localFavorites = localFavorites.filter(id => id !== productId);
        localStorage.setItem('favorites', JSON.stringify(localFavorites));
    }
    updateFavoriteButtons();
}

// Проверить, в избранном ли товар
export async function isFavorite(productId) {
    if (currentUser) {
        const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', productId);
        const docSnap = await getDoc(favoriteRef);
        return docSnap.exists();
    } else {
        return localFavorites.includes(productId);
    }
}

// Загрузить избранные из Firebase
async function loadFirebaseFavorites() {
    if (!currentUser) return;
    const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
    const snapshot = await getDocs(favoritesRef);
    localFavorites = snapshot.docs.map(doc => doc.id);
    updateFavoriteButtons();
}

// Синхронизировать локальные избранные с Firebase (при входе)
async function syncLocalToFirebase() {
    if (!currentUser || localFavorites.length === 0) return;
    for (const productId of localFavorites) {
        const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', productId);
        await setDoc(favoriteRef, { id: productId, addedAt: new Date() });
    }
    localFavorites = [];
    localStorage.removeItem('favorites');
    await loadFirebaseFavorites();
}

// Обновить все кнопки «В избранное» на странице
function updateFavoriteButtons() {
    document.querySelectorAll('.btn-fav').forEach(btn => {
        const productId = btn.dataset.id;
        if (localFavorites.includes(productId)) {
            btn.classList.add('active');
            btn.innerHTML = '❤️';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '🤍';
        }
    });
}

// Получить список избранных товаров (для страницы "Избранное")
export async function getFavoriteProducts() {
    if (currentUser) {
        const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
        const snapshot = await getDocs(favoritesRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
        return localFavorites.map(id => ({ id }));
    }
}
