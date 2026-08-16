// ==========================================
// ATTENDANCE SYSTEM V2
// APP LOGIC
// ==========================================

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const adminDashboard = document.getElementById("adminDashboard");
const studentDashboard = document.getElementById("studentDashboard");

const welcomeText = document.getElementById("welcomeText");


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;
let currentRole = null;


// ==========================================
// TODAY'S DATE
// ==========================================

function getToday() {
  return new Date().toISOString().split("T")[0];
}


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async function (event) {
  
  console.log("LOGIN BUTTON CLICKED");
  
  event.preventDefault();
  

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  loginMessage.textContent = "Logging in...";

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

  } catch (error) {

    console.error("FIREBASE LOGIN ERROR:", error);

    loginMessage.textContent =
      getLoginError(error.code);

  }

});


// ==========================================
// LOGIN ERROR MESSAGES
// ==========================================

function getLoginError(code) {

  switch (code) {

    case "auth/user-not-found":
      return "User not found.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";

    case "auth/invalid-credential":
      return "Invalid email or password.";

    default:
      return "Login failed. Please try again.";

  }

}


// ==========================================
// AUTH STATE
// ==========================================

auth.onAuthStateChanged(async function (user) {

  if (!user) {

    currentUser = null;
    currentRole = null;

    showLogin();

    return;

  }

  currentUser = user;

  await loadUserRole(user.uid);

});


// ==========================================
// LOAD USER ROLE
// ==========================================

async function loadUserRole(uid) {

  try {

    const snapshot =
      await db.ref("users/" + uid).once("value");

    const userData = snapshot.val();

    if (!userData) {

      alert(
        "Your account does not have a role assigned."
      );

      await auth.signOut();

      return;

    }


    currentRole = userData.role;


    if (currentRole === "admin") {

      showAdminDashboard();

      loadAdminData();

    }

    else if (currentRole === "student") {

      showStudentDashboard();

      loadStudentData();

    }

    else {

      alert("Invalid user role.");

      await auth.signOut();

    }

  } catch (error) {

    console.error(error);

    alert(
      "Could not load your account information."
    );

  }

}


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

  loginPage.style.display = "flex";

  dashboard.style.display = "none";

}


// ==========================================
// SHOW ADMIN
// ==========================================

function showAdminDashboard() {

  loginPage.style.display = "none";

  dashboard.style.display = "block";

  adminDashboard.style.display = "block";

  studentDashboard.style.display = "none";

  welcomeText.textContent =
    "Logged in as Administrator";

}


// ==========================================
// SHOW STUDENT
// ==========================================

function showStudentDashboard() {

  loginPage.style.display = "none";

  dashboard.style.display = "block";

  adminDashboard.style.display = "none";

  studentDashboard.style.display = "block";

  welcomeText.textContent =
    currentUser.email;

}


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async function () {

  try {

    await auth.signOut();

  } catch (error) {

    console.error(error);

  }

});


// ==========================================
// ADMIN DATA
// ==========================================

async function loadAdminData() {

  const snapshot =
    await db.ref("students").once("value");

  const students =
    snapshot.val() || {};

  renderAdminStudents(students);

}


// ==========================================
// RENDER ADMIN STUDENTS
// ==========================================

function renderAdminStudents(students) {

  const table =
    document.getElementById("adminStudentTable");

  const ids =
    Object.keys(students);

  document.getElementById("totalStudents").textContent =
    ids.length;


  if (ids.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          No students yet.
        </td>
      </tr>
    `;

    return;

  }


  let html = "";

  let present = 0;
  let absent = 0;


  ids.forEach(function (id) {

    const student = students[id];

    const records =
      student.records || {};

    const today =
      getToday();

    const todayStatus =
      records[today] || "-";


    if (todayStatus === "P") {
      present++;
    }

    if (todayStatus === "A") {
      absent++;
    }


    const percentage =
      calculatePercentage(records);


    html += `
      <tr>

        <td>
          ${escapeHTML(student.name || "-")}
        </td>

        <td>
          ${escapeHTML(student.enroll || "-")}
        </td>

        <td>
          ${todayStatus}
        </td>

        <td>
          ${percentage}%
        </td>

        <td>

          <button
            onclick="adminMarkAttendance('${id}', 'P')"
            class="present-btn"
          >
            P
          </button>

          <button
            onclick="adminMarkAttendance('${id}', 'A')"
            style="background:#dc2626;color:white;"
          >
            A
          </button>

        </td>

      </tr>
    `;

  });


  table.innerHTML = html;


  document.getElementById("presentToday").textContent =
    present;

  document.getElementById("absentToday").textContent =
    absent;

}


// ==========================================
// CALCULATE ATTENDANCE
// ==========================================

function calculatePercentage(records) {

  const values =
    Object.values(records || {});

  const total =
    values.length;

  if (total === 0) {
    return "0.0";
  }


  const present =
    values.filter(function (value) {

      return value === "P";

    }).length;


  return ((present / total) * 100).toFixed(1);

}


// ==========================================
// ADMIN MARK ATTENDANCE
// ==========================================

async function adminMarkAttendance(id, status) {

  if (currentRole !== "admin") {

    alert("Only admin can modify attendance.");

    return;

  }


  const today =
    getToday();


  try {

    await db.ref(
      "students/" +
      id +
      "/records/" +
      today
    ).set(status);


    loadAdminData();

  } catch (error) {

    console.error(error);

    alert(
      "Could not update attendance."
    );

  }

}


// ==========================================
// ADD STUDENT
// ==========================================

document
  .getElementById("addStudentBtn")
  .addEventListener("click", async function () {

    if (currentRole !== "admin") {

      alert(
        "Only admin can add students."
      );

      return;

    }


    const name =
      document
        .getElementById("studentName")
        .value
        .trim();


    const enroll =
      document
        .getElementById("studentEnroll")
        .value
        .trim();


    const email =
      document
        .getElementById("studentEmail")
        .value
        .trim();


    if (!name || !enroll || !email) {

      alert(
        "Please fill all student fields."
      );

      return;

    }


    try {

      await db.ref("students").push({

        name: name,

        enroll: enroll,

        email: email,

        records: {}

      });


      document.getElementById(
        "studentName"
      ).value = "";


      document.getElementById(
        "studentEnroll"
      ).value = "";


      document.getElementById(
        "studentEmail"
      ).value = "";


      alert(
        "Student added successfully."
      );


      loadAdminData();

    } catch (error) {

      console.error(error);

      alert(
        "Could not add student."
      );

    }

  });


// ==========================================
// STUDENT DATA
// ==========================================

async function loadStudentData() {

  const snapshot =
    await db.ref("students").once("value");

  const students =
    snapshot.val() || {};


  renderStudentPreview(students);

  loadMyAttendance(students);

}


// ==========================================
// STUDENT PREVIEW
// ==========================================

function renderStudentPreview(students) {

  const table =
    document.getElementById(
      "studentPreviewTable"
    );


  const ids =
    Object.keys(students);


  if (ids.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="3" class="empty">
          No students yet.
        </td>
      </tr>
    `;

    return;

  }


  let html = "";


  ids.forEach(function (id) {

    const student =
      students[id];


    const percentage =
      calculatePercentage(
        student.records || {}
      );


    html += `
      <tr>

        <td>
          ${escapeHTML(student.name || "-")}
        </td>

        <td>
          ${escapeHTML(student.enroll || "-")}
        </td>

        <td>
          ${percentage}%
        </td>

      </tr>
    `;

  });


  table.innerHTML = html;

}


// ==========================================
// LOAD MY ATTENDANCE
// ==========================================

function loadMyAttendance(students) {

  let myStudent = null;


  Object.values(students).forEach(function (student) {

    if (
      student.email &&
      currentUser.email &&
      student.email.toLowerCase() ===
      currentUser.email.toLowerCase()
    ) {

      myStudent = student;

    }

  });


  if (!myStudent) {

    document.getElementById(
      "myAttendancePercentage"
    ).textContent = "0%";

    document.getElementById(
      "myTodayStatus"
    ).textContent = "Student record not found.";

    return;

  }


  const percentage =
    calculatePercentage(
      myStudent.records || {}
    );


  document.getElementById(
    "myAttendancePercentage"
  ).textContent =
    percentage + "%";


  const today =
    getToday();


  const todayStatus =
    (myStudent.records || {})[today];


  if (todayStatus === "P") {

    document.getElementById(
      "myTodayStatus"
    ).textContent = "Present";

    document.getElementById(
      "markMyAttendanceBtn"
    ).disabled = true;

  }

  else if (todayStatus === "A") {

    document.getElementById(
      "myTodayStatus"
    ).textContent = "Absent";

  }

  else {

    document.getElementById(
      "myTodayStatus"
    ).textContent = "Not Marked";

  }


  window.currentStudentId =
    Object.keys(students).find(function (id) {

      return (
        students[id].email &&
        students[id].email.toLowerCase() ===
        currentUser.email.toLowerCase()
      );

    });

}


// ==========================================
// STUDENT MARK OWN ATTENDANCE
// ==========================================

document
  .getElementById("markMyAttendanceBtn")
  .addEventListener("click", async function () {

    if (currentRole !== "student") {

      alert(
        "Only students can use this button."
      );

      return;

    }


    const studentId =
      window.currentStudentId;


    if (!studentId) {

      alert(
        "Your student record was not found."
      );

      return;

    }


    const today =
      getToday();


    try {

      await db.ref(
        "students/" +
        studentId +
        "/records/" +
        today
      ).set("P");


      alert(
        "Attendance marked successfully."
      );


      loadStudentData();

    } catch (error) {

      console.error(error);

      alert(
        "Could not mark attendance."
      );

    }

  });


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}
