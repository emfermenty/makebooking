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
  let mastersCache = {}; // Кэш для данных о мастерах

  // Делаем функции глобальными для использования в onclick
  window.openRecordModal = openRecordModal;
  window.showRecordComment = showRecordComment;
  window.showAnamnesis = showAnamnesis;

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

  // Функция для получения данных о мастере
  async function getMasterInfo(masterId) {
    // Проверяем кэш
    if (mastersCache[masterId]) {
      return mastersCache[masterId];
    }

    try {
      const response = await fetch(`https://antohabeuty.store/api/api/masters/${masterId}`);
      if (!response.ok) {
        throw new Error('Мастер не найден');
      }
      const master = await response.json();
      
      // Сохраняем в кэш
      mastersCache[masterId] = master;
      return master;
    } catch (error) {
      console.error(`Ошибка загрузки данных мастера ${masterId}:`, error);
      return {
        id: masterId,
        name: `Мастер ${masterId}`,
        specialization: 'Неизвестно',
        description: 'Данные не загружены'
      };
    }
  }

  // Функция для группировки слотов по времени
  function groupSlotsByTime(slots) {
    const grouped = {};
    
    slots.forEach(slot => {
      const dateTime = slot.slot_datetime;
      const time = dateTime.split('T')[1].substring(0, 5);
      const date = dateTime.split('T')[0];
      const key = `${date}_${time}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(slot);
    });
    
    return grouped;
  }

  async function renderWeekSchedule(week) {
    weekLabel.textContent = formatWeekLabel(week);
    scheduleContainer.innerHTML = '<div class="loading">Загрузка расписания...</div>';

    try {
      const response = await fetch('https://antohabeuty.store/api/api/books/slots/');
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      const slots = await response.json();

      let scheduleHTML = '';
      
      week.forEach(day => {
        const dayStr = day.toISOString().split('T')[0];
        
        // Получаем все слоты для этого дня
        const daySlots = slots.filter(slot => {
          if (!slot.slot_datetime) return false;
          return slot.slot_datetime.startsWith(dayStr);
        });
        
        // Группируем слоты по времени
        const groupedSlots = groupSlotsByTime(daySlots);
        const timeKeys = Object.keys(groupedSlots).sort();

        scheduleHTML += `
          <div class="schedule-day">
            <div class="day-header">
              <strong>${formatDate(day)}</strong>
              <span class="day-name">${day.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
            </div>
            <div class="day-slots">
              ${timeKeys.length > 0 ? 
                timeKeys.map(timeKey => {
                  const time = timeKey.split('_')[1];
                  const date = timeKey.split('_')[0];
                  const timeSlots = groupedSlots[timeKey];
                  
                  return `
                    <div class="time-slot-group">
                      <div class="time-header">${time}</div>
                      <div class="masters-slots">
                        ${timeSlots.map(slot => {
                          const status = slot.status ? slot.status.toLowerCase() : '';
                          const isOpen = slot.status === "Открыто";
                          const isClosed = slot.status === "Закрыто для записи" || slot.status === "NOOPEN";
                          const telegramId = slot.telegram_id;
                          const recordId = slot.id;
                          const slotDateTime = slot.slot_datetime;
                          const masterId = slot.master_id;
                          
                          // Определяем кликабельность и подсказку
                          let clickHandler = '';
                          let additionalInfo = '';
                          
                          if (isOpen) {
                            clickHandler = `onclick="openRecordModal('${masterId}', '${slotDateTime}', '${recordId}')"`;
                            additionalInfo = '<span class="slot-hint">👆 Нажмите для закрытия записи</span>';
                          } else if (isClosed) {
                            clickHandler = `onclick="showRecordComment('${masterId}', '${slotDateTime}', '${recordId}')"`;
                            additionalInfo = '<span class="slot-hint">👆 Нажмите для просмотра комментария</span>';
                          } else if (telegramId && (slot.status === "Ожидание" || slot.status === "Подтверждено")) {
                            clickHandler = `onclick="showAnamnesis('${telegramId}', '${masterId}')"`;
                            additionalInfo = '<span class="slot-hint">👆 Нажмите для анамнеза</span>';
                          }
                          
                          return `
                            <div class="slot-item ${status}" 
                                 data-telegram-id="${telegramId || ''}" 
                                 data-master-id="${masterId}"
                                 data-record-id="${recordId}"
                                 data-slot-datetime="${slotDateTime}"
                                 ${clickHandler}
                                 style="cursor: ${clickHandler ? 'pointer' : 'default'}">
                              <div class="slot-master-info">
                                <span class="master-name">Мастер ${masterId}</span>
                              </div>
                              <div class="slot-content">
                                <span class="slot-status">${slot.status || 'Неизвестно'}</span>
                                <div class="client-info">
                                  ${telegramId ? 
                                    `<span class="client-name">ID: ${telegramId}</span>` : 
                                    `<span class="client-name">${isOpen ? 'Свободно' : 'Недоступно'}</span>`
                                  }
                                  ${additionalInfo || ''}
                                </div>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('') : 
                '<div class="no-slots">Нет записей</div>'
              }
            </div>
          </div>
        `;
      });

      scheduleContainer.innerHTML = scheduleHTML;
      
      // Загружаем и отображаем информацию о мастерах
      await loadMastersInfo();
      
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      scheduleContainer.innerHTML = '<div class="error">Ошибка загрузки расписания: ' + error.message + '</div>';
    }
  }

  // Функция для загрузки и отображения информации о мастерах
  async function loadMastersInfo() {
    const masterElements = document.querySelectorAll('[data-master-id]');
    const masterIds = [...new Set(Array.from(masterElements).map(el => el.getAttribute('data-master-id')))];
    
    // Загружаем данные всех мастеров
    const mastersPromises = masterIds.map(masterId => getMasterInfo(masterId));
    const masters = await Promise.all(mastersPromises);
    
    // Обновляем отображение имен мастеров
    masters.forEach(master => {
      const masterNameElements = document.querySelectorAll(`[data-master-id="${master.id}"] .master-name`);
      masterNameElements.forEach(element => {
        element.textContent = master.name;
        element.title = `${master.specialization} - ${master.description}`;
      });
    });
  }

  // Модальное окно для закрытия записи с комментарием
  function openRecordModal(masterId, slotDateTime, recordId) {
    const modal = document.createElement('div');
    modal.className = 'record-modal';
    modal.innerHTML = `
      <div class="record-content">
        <div class="record-header">
          <h3>Закрыть запись</h3>
          <button class="record-close">&times;</button>
        </div>
        <div class="record-form">
          <div class="note">
            <strong>Внимание:</strong> Вы записываете клиента вручную. Клиенты больше не смогут записаться на это время.
          </div>
          <div class="form-group">
            <label for="recordComment">Комментарий (обязательно):</label>
            <textarea id="recordComment" placeholder="Укажите в комментарии имя клиента и процедуру..." rows="4" required></textarea>
            <small style="color: #666; font-size: 12px;">Например: "Иван Иванов - Массаж спины" или "Елена - Чистка лица"</small>
          </div>
          <div class="form-actions">
            <button class="btn-cancel">Отмена</button>
            <button class="btn-submit">Закрыть запись</button>
          </div>
        </div>
        <div class="record-info">
          <small>Мастер ID: ${masterId}, Время: ${new Date(slotDateTime).toLocaleString('ru-RU')}</small>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики
    const closeBtn = modal.querySelector('.record-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const submitBtn = modal.querySelector('.btn-submit');
    const commentInput = modal.querySelector('#recordComment');
    
    const closeModal = () => {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', escapeHandler);
    };
    
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    submitBtn.addEventListener('click', async () => {
      const comment = commentInput.value.trim();
      
      if (!comment) {
        alert('Пожалуйста, введите комментарий');
        commentInput.focus();
        return;
      }
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
        
        // Данные для отправки на сервер
        const recordData = {
          master_id: parseInt(masterId),
          slot_datetime: slotDateTime,
          comment: comment
        };
        
        console.log('Отправка данных:', recordData);
        
        // Используем ваш endpoint для обновления записи
        const response = await fetch('http://https://antohabeuty.store/api/api/records/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData)
        });
        
        console.log('Ответ сервера:', response.status, response.statusText);
        
        if (!response.ok) {
          let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            console.error('Ошибка парсинга ошибки:', e);
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Результат:', result);
        
        alert(result.message || 'Запись успешно закрыта!');
        closeModal();
        
        // Обновляем расписание
        const currentWeek = getWeekDates(currentDate);
        await renderWeekSchedule(currentWeek);
        
      } catch (error) {
        console.error('Ошибка закрытия записи:', error);
        alert('Ошибка при закрытии записи: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Закрыть запись';
      }
    });
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', escapeHandler);
    
    // Фокус на поле комментария
    commentInput.focus();
  }

  // Просмотр комментария для закрытых записей
  async function showRecordComment(masterId, slotDateTime, recordId) {
    try {
      console.log('Запрос комментария:', { masterId, slotDateTime, recordId });
      
      const encodedDateTime = encodeURIComponent(slotDateTime);
      const url = `http://https://antohabeuty.store/api/api/records/slot/?master_id=${masterId}&slot_datetime=${encodedDateTime}`;
      
      console.log('URL запроса:', url);
      
      const response = await fetch(url);
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Ошибка парсинга ошибки:', e);
        }
        throw new Error(errorMessage);
      }
      
      const record = await response.json();
      console.log('Полученная запись:', record);
      
      const modal = document.createElement('div');
      modal.className = 'comment-modal';
      modal.innerHTML = `
        <div class="comment-content">
          <div class="comment-header">
            <h3>Информация о записи</h3>
            <button class="comment-close">&times;</button>
          </div>
          <div class="comment-info">
            <p><strong>Мастер:</strong> ${record.master_name || `ID: ${masterId}`}</p>
            <p><strong>Время:</strong> ${new Date(slotDateTime).toLocaleString('ru-RU')}</p>
            <p><strong>Статус:</strong> ${record.status || 'Закрыто для записи'}</p>
            ${record.user_id ? `<p><strong>ID клиента:</strong> ${record.user_id}</p>` : ''}
          </div>
          <div class="comment-text">
            <h4>Комментарий:</h4>
            <div class="comment-body">${record.comment ? record.comment.replace(/\n/g, '<br>') : '<em>Комментарий отсутствует</em>'}</div>
          </div>
          <div class="form-actions">
            <button class="btn-close">Закрыть</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('.comment-close');
      const closeActionBtn = modal.querySelector('.btn-close');
      
      const closeModal = () => {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      };
      
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      closeBtn.addEventListener('click', closeModal);
      closeActionBtn.addEventListener('click', closeModal);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      // Закрытие по Escape
      document.addEventListener('keydown', escapeHandler);
      
    } catch (error) {
      console.error('Ошибка загрузки комментария:', error);
      alert('Не удалось загрузить информацию о записи: ' + error.message);
    }
  }

  // Функция для показа анамнеза
  async function showAnamnesis(telegramId, masterId) {
    try {
      console.log('Запрос анамнеза:', { telegramId, masterId });
      
      const response = await fetch(`https://antohabeuty.store/api/api/anamnez/${telegramId}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }
      
      const anamnesis = await response.json();
      console.log('Полученный анамнез:', anamnesis);
      
      const masterInfo = await getMasterInfo(masterId);
      
      // Создаем модальное окно
      const modal = document.createElement('div');
      modal.className = 'anamnesis-modal';
      modal.innerHTML = `
        <div class="anamnesis-content">
          <div class="anamnesis-header">
            <h3>Анамнез пользователя</h3>
            <button class="anamnesis-close">&times;</button>
          </div>
          <div class="master-info-modal">
            <strong>Мастер:</strong> ${masterInfo.name}<br>
            <span class="specialization">${masterInfo.specialization}</span><br>
            <span class="description">${masterInfo.description}</span>
          </div>
          <div class="anamnesis-info">
            ${renderAnamnesisInfo(anamnesis)}
          </div>
          <div class="form-actions">
            <button class="btn-close">Закрыть</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('.anamnesis-close');
      const closeActionBtn = modal.querySelector('.btn-close');
      
      const closeModal = () => {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      };
      
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      closeBtn.addEventListener('click', closeModal);
      closeActionBtn.addEventListener('click', closeModal);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      // Закрытие по Escape
      document.addEventListener('keydown', escapeHandler);
      
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
          <div class="form-actions">
            <button class="btn-close">Закрыть</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('.anamnesis-close');
      const closeActionBtn = modal.querySelector('.btn-close');
      
      const closeModal = () => {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      };
      
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      closeBtn.addEventListener('click', closeModal);
      closeActionBtn.addEventListener('click', closeModal);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      document.addEventListener('keydown', escapeHandler);
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

