// favorites.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAVOJtq1tCCie0dDjB_GDoH8AQB0EKe_84",
    authDomain: "chuvash-souvenir.firebaseapp.com",
    projectId: "chuvash-souvenir",
    storageBucket: "chuvash-souvenir.firebasestorage.app",
    messagingSenderId: "754730678926",
    appId: "1:754730678926:web:5e45e557c0d298072027df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
let updateCallbacks = [];

// Слушаем изменения входа/выхода
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        await syncLocalToFirebase();
        await loadFirebaseFavorites();
    } else {
        localStorage.setItem('favorites', JSON.stringify(localFavorites));
    }
    notifyUpdate();
});

function notifyUpdate() {
    updateCallbacks.forEach(cb => cb());
}

export function onFavoritesUpdate(callback) {
    updateCallbacks.push(callback);
}

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
    notifyUpdate();
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
    notifyUpdate();
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

// Получить текущий статус избранного (синхронно для кнопок)
export function getFavoriteIds() {
    return [...localFavorites];
}
