const firebaseConfig = {
  apiKey: "AIzaSyDGd7AS81Q53meBWVADmzDXAv_hwZaMMtw",
  authDomain: "attendance-app-f5c57.firebaseapp.com",
  databaseURL: "https://attendance-app-f5c57-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "attendance-app-f5c57"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
