export function renderAdminProfile(container) {
  container.innerHTML = `
    <div class="page">
      <h2>Профиль администратора</h2>
      <div class="profile-info">
        <div class="info-item">
          <label>Имя:</label>
          <span>Администратор</span>
        </div>
        <div class="info-item">
          <label>Роль:</label>
          <span>Админ</span>
        </div>
        <div class="info-item">
          <label>Статистика:</label>
          <span>Записей сегодня: <span id="todayCount">0</span></span>
        </div>
      </div>
      <button id="logoutBtn" class="logout-btn">Выйти</button>
    </div>
  `;

  initializeAdminProfile();
}

function initializeAdminProfile() {
  // Загрузка статистики
  loadStatistics();
  
  // Обработчик выхода
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      // Логика выхода
      window.Telegram.WebApp.close();
    }
  });
}

async function loadStatistics() {
  try {
    const response = await fetch('https://antohabeuty.store/api/api/books/slots/');
    const slots = await response.json();
    
    const today = new Date().toISOString().split('T')[0];
    const todaySlots = slots.filter(slot => slot.slot_datetime.startsWith(today));
    
    document.getElementById('todayCount').textContent = todaySlots.length;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
}