export function renderSchedule(container) {
  // Добавляем CSS файл
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-schedule.css';
  document.head.appendChild(link);

  container.innerHTML = `
    <div class="page">
      <h2>Расписание</h2>
      <div class="controls">
        <button id="prevWeek">◀️</button>
        <div id="weekLabel"></div>
        <button id="nextWeek">▶️</button>
      </div>
      <div id="scheduleContainer"></div>
    </div>
  `;

  initializeSchedule();
}

function initializeSchedule() {
  const scheduleContainer = document.getElementById('scheduleContainer');
  const weekLabel = document.getElementById('weekLabel');
  const prevWeekBtn = document.getElementById('prevWeek');
  const nextWeekBtn = document.getElementById('nextWeek');

  let currentDate = new Date();

  function getWeekDates(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  }

  function formatDate(date) {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('ru-RU', options);
  }

  function formatWeekLabel(week) {
    const start = week[0];
    const end = week[6];
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  async function renderWeekSchedule(week) {
    weekLabel.textContent = formatWeekLabel(week);
    scheduleContainer.innerHTML = '<div class="loading">Загрузка расписания...</div>';

    try {
      const response = await fetch('https://antohabeuty.store/api/api/books/slots/');
      const slots = await response.json();

      let scheduleHTML = '';
      
      week.forEach(day => {
        const dayStr = day.toISOString().split('T')[0];
        const daySlots = slots.filter(slot => slot.slot_datetime.startsWith(dayStr));
        
        scheduleHTML += `
          <div class="schedule-day">
            <div class="day-header">
              <strong>${formatDate(day)}</strong>
              <span class="day-name">${day.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
            </div>
            <div class="day-slots">
              ${daySlots.length > 0 ? 
                daySlots.map(slot => {
                  const time = slot.slot_datetime.split('T')[1].substring(0, 5);
                  const status = slot.status.toLowerCase();
                  const telegramId = slot.telegram_id;
                  const isClickable = telegramId && (slot.status === "Ожидание" || slot.status === "Подтверждено");
                  
                  return `
                  <div class="slot-item ${status}" data-telegram-id="${telegramId || ''}" data-clickable="${isClickable}">
                    <span class="slot-time">${time}</span>
                    <span class="slot-status">${slot.status}</span>
                    <div class="client-info">
                      ${telegramId ? `
                        <span class="client-name">ID: ${telegramId}</span>
                        ${isClickable ? '<span class="telegram-id">👆 Нажмите для анамнеза</span>' : ''}
                      ` : '<span class="client-name">Свободно</span>'}
                    </div>
                  </div>
                `}).join('') : 
                '<div class="no-slots">Нет записей</div>'
              }
            </div>
          </div>
        `;
      });

      scheduleContainer.innerHTML = scheduleHTML;
      
      // Добавляем обработчики кликов для слотов с анамнезом
      addSlotClickHandlers();
      
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      scheduleContainer.innerHTML = '<div class="error">Ошибка загрузки расписания</div>';
    }
  }

  function addSlotClickHandlers() {
    const slotItems = document.querySelectorAll('.slot-item[data-clickable="true"]');
    
    slotItems.forEach(slot => {
      slot.addEventListener('click', async () => {
        const telegramId = slot.getAttribute('data-telegram-id');
        if (telegramId) {
          await showAnamnesis(telegramId);
        }
      });
    });
  }

  async function showAnamnesis(telegramId) {
    try {
      const response = await fetch(`https://antohabeuty.store/api/api/anamnez/${telegramId}`);
      
      if (!response.ok) {
        throw new Error('Анамнез не найден');
      }
      
      const anamnesis = await response.json();
      
      // Создаем модальное окно
      const modal = document.createElement('div');
      modal.className = 'anamnesis-modal';
      modal.innerHTML = `
        <div class="anamnesis-content">
          <div class="anamnesis-header">
            <h3>Анамнез пользователя</h3>
            <button class="anamnesis-close">&times;</button>
          </div>
          <div class="anamnesis-info">
            ${renderAnamnesisInfo(anamnesis)}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Обработчики закрытия
      const closeBtn = modal.querySelector('.anamnesis-close');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
      
    } catch (error) {
      console.error('Ошибка загрузки анамнеза:', error);
      
      // Показываем сообщение об ошибке
      const modal = document.createElement('div');
      modal.className = 'anamnesis-modal';
      modal.innerHTML = `
        <div class="anamnesis-content">
          <div class="anamnesis-header">
            <h3>Анамнез пользователя</h3>
            <button class="anamnesis-close">&times;</button>
          </div>
          <div class="no-anamnesis">
            ❌ Не удалось загрузить анамнез<br>
            <small>${error.message}</small>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('.anamnesis-close');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  }

  function renderAnamnesisInfo(anamnesis) {
    const fields = [
      { label: 'Telegram ID', key: 'telegram_id' },
      { label: 'Телефон', key: 'phone' },
      { label: 'Имя пользователя', key: 'username' },
      { label: 'Дата рождения', key: 'birthday', format: (value) => value ? new Date(value).toLocaleDateString('ru-RU') : 'Не указано' },
      { label: 'Роль', key: 'role' },
      { label: 'Хронические заболевания', key: 'chronic_diseases' },
      { label: 'Использовал ранее', key: 'makeusebefore', type: 'boolean' },
      { label: 'Процедуры ранее', key: 'makeprocedurebefore' },
      { label: 'Средства ранее', key: 'makemeansbefore' },
      { label: 'Вид работы', key: 'viewjob' },
      { label: 'Результат', key: 'result' },
      { label: 'Жалобы', key: 'complaints' },
      { label: 'Анамнез заполнен', key: 'anamnesis', type: 'boolean' }
    ];
    
    return fields.map(field => {
      let value = anamnesis[field.key];
      
      if (value === null || value === undefined || value === '') {
        value = 'Не указано';
      } else if (field.format) {
        value = field.format(value);
      } else if (field.type === 'boolean') {
        value = value ? 'Да' : 'Нет';
      }
      
      const valueClass = field.type === 'boolean' ? `boolean-${value === 'Да' ? 'true' : 'false'}` : '';
      
      return `
        <div class="info-row">
          <span class="info-label">${field.label}:</span>
          <span class="info-value ${valueClass}">${value}</span>
        </div>
      `;
    }).join('');
  }

  let currentWeek = getWeekDates(currentDate);
  renderWeekSchedule(currentWeek);

  prevWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    currentWeek = getWeekDates(currentDate);
    renderWeekSchedule(currentWeek);
  });

  nextWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    currentWeek = getWeekDates(currentDate);
    renderWeekSchedule(currentWeek);
  });
}
