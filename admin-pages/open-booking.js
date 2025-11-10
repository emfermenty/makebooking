export function renderOpenBooking(container) {
  // Добавляем CSS файл
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-open-booking.css';
  document.head.appendChild(link);

  container.innerHTML = `
    <div class="page">
      <h2>Открыть запись</h2>
      
      <div class="filters">
        <div class="filter-group">
          <label for="cabinetSelect">Кабинет:</label>
          <select id="cabinetSelect">
            <option value="">Выберите кабинет</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="masterSelect">Мастер:</label>
          <select id="masterSelect">
            <option value="">Выберите мастера</option>
          </select>
        </div>
      </div>

      <div class="controls">
        <button id="prevMonth">◀️</button>
        <div id="monthLabel"></div>
        <button id="nextMonth">▶️</button>
      </div>
      
      <div class="calendar" id="calendar"></div>
      
      <div class="slots" id="slots" style="display: none;">
        <h3>Выберите время для записи</h3>
        <div class="slots-info">
          <div class="selected-info">
            <strong>Выбрано:</strong> 
            <span id="selectedDateInfo"></span> | 
            <span id="selectedMasterInfo"></span>
          </div>
          <div id="cabinetStatus"></div>
        </div>
        <div id="slotsContainer"></div>
        <button id="saveSlots" class="btn-primary">Сохранить слоты</button>
      </div>
    </div>
  `;

  initializeOpenBooking();
}

function initializeOpenBooking() {
  const tg = window.Telegram.WebApp;
  tg.ready();

  const calendarEl = document.getElementById("calendar");
  const monthLabel = document.getElementById("monthLabel");
  const slotsEl = document.getElementById("slots");
  const slotsContainer = document.getElementById("slotsContainer");
  const saveButton = document.getElementById("saveSlots");
  const cabinetSelect = document.getElementById("cabinetSelect");
  const masterSelect = document.getElementById("masterSelect");
  const selectedDateInfo = document.getElementById("selectedDateInfo");
  const selectedMasterInfo = document.getElementById("selectedMasterInfo");
  const cabinetStatus = document.getElementById("cabinetStatus");

  let currentDate = new Date();
  let selectedDate = null;
  let selectedSlots = new Set();
  let cabinets = [];
  let masters = [];
  let allSlots = [];
  let selectedCabinetId = null;
  let selectedMasterId = null;

  // Базовый URL API
  //const API_BASE = 'http://localhost:8000/api';
  const API_BASE = 'https://antohabeuty.store/api/api';

  const monthNames = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
  ];

  // Загрузка данных при инициализации
  loadCabinets();
  loadAllSlots();

  async function loadCabinets() {
    try {
      const response = await fetch(`${API_BASE}/cabinets`);
      if (response.ok) {
        cabinets = await response.json();
        populateCabinetSelect();
      } else {
        console.error('Ошибка загрузки кабинетов');
      }
    } catch (error) {
      console.error('Ошибка загрузки кабинетов:', error);
    }
  }

  async function loadMasters(cabinetId) {
    try {
      const response = await fetch(`${API_BASE}/cabinet/${cabinetId}`);
      if (response.ok) {
        masters = await response.json();
        populateMasterSelect();
      } else {
        console.error('Ошибка загрузки мастеров');
        masters = [];
        populateMasterSelect();
      }
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
      masters = [];
      populateMasterSelect();
    }
  }

  async function loadAllSlots() {
    try {
      const response = await fetch(`${API_BASE}/books/slots/`);
      if (response.ok) {
        allSlots = await response.json();
      } else {
        console.error('Ошибка загрузки расписания');
        allSlots = [];
      }
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      allSlots = [];
    }
  }

  function populateCabinetSelect() {
    cabinetSelect.innerHTML = '<option value="">Выберите кабинет</option>';
    cabinets.forEach(cabinet => {
      cabinetSelect.innerHTML += `<option value="${cabinet.id}">${cabinet.title}</option>`;
    });
  }

  function populateMasterSelect() {
    masterSelect.innerHTML = '<option value="">Выберите мастера</option>';
    if (masters.length > 0) {
      masters.forEach(master => {
        masterSelect.innerHTML += `<option value="${master.id}">${master.name} (${master.specialization || 'без специализации'})</option>`;
      });
    } else {
      masterSelect.innerHTML += '<option value="" disabled>В выбранном кабинете нет мастеров</option>';
    }
  }

  function isCabinetBusy(cabinetId, slotDateTime, currentSlotMasterId = null) {
    const slotDate = new Date(slotDateTime).toISOString().split('T')[0];
    const slotTime = slotDateTime.split('T')[1];
    
    // Получаем всех мастеров выбранного кабинета
    const cabinetMasters = masters.filter(m => m.cabinet_id === parseInt(cabinetId));
    const cabinetMasterIds = cabinetMasters.map(m => m.id);
    
    // Ищем слоты в это же время у других мастеров этого кабинета
    const conflictingSlots = allSlots.filter(slot => {
      const slotDateStr = slot.slot_datetime.split('T')[0];
      const slotTimeStr = slot.slot_datetime.split('T')[1];
      
      return slotDateStr === slotDate && 
             slotTimeStr === slotTime &&
             cabinetMasterIds.includes(slot.master_id) &&
             slot.master_id !== currentSlotMasterId && // Исключаем текущего мастера
             (slot.status === "Подтверждено" || slot.status === "Ожидание" || slot.status === "Открыто");
    });
    
    return conflictingSlots.length > 0;
  }

  function renderCalendar(date) {
      calendarEl.innerHTML = '';
      const year = date.getFullYear();
      const month = date.getMonth();
      monthLabel.innerText = `${monthNames[month]} ${year}`;

      const firstDay = new Date(year, month, 1).getDay();
      const lastDay = new Date(year, month + 1, 0).getDate();

      for(let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++){
          calendarEl.appendChild(document.createElement("div"));
      }

      const today = new Date();
      today.setHours(0,0,0,0);

      for(let i = 1; i <= lastDay; i++){
          const dayEl = document.createElement("div");
          dayEl.classList.add("day");
          dayEl.innerText = i;

          const dayDate = new Date(year, month, i);

          if(dayDate < today) {
              dayEl.style.backgroundColor = "#e0e0e0";
              dayEl.style.color = "#999";
              dayEl.style.cursor = "not-allowed";
          } else {
              dayEl.addEventListener("click", () => {
                  if (!selectedCabinetId || !selectedMasterId) {
                      showMessage('Сначала выберите кабинет и мастера!');
                      return;
                  }
                  
                  document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
                  dayEl.classList.add("selected");
                  selectedDate = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                  selectedSlots.clear();
                  renderSlots(selectedDate, dayDate);
              });
          }

          calendarEl.appendChild(dayEl);
      }
  }

  async function renderSlots(date, dayDate) {
      slotsEl.style.display = 'block';
      slotsContainer.innerHTML = '';
      selectedDateInfo.textContent = formatDisplayDate(date);
      
      // Находим выбранного мастера
      const selectedMaster = masters.find(m => m.id === parseInt(selectedMasterId));
      selectedMasterInfo.textContent = selectedMaster ? selectedMaster.name : 'Мастер не выбран';
      
      const now = new Date();

      // Показываем статус кабинета
      updateCabinetStatus(date);

      // Временные слоты с 9:00 до 18:00
      const timeSlots = [];
      for(let hour = 9; hour <= 18; hour++) {
          timeSlots.push(`${String(hour).padStart(2,'0')}:00`);
      }

      timeSlots.forEach(timeText => {
          const slotBtn = document.createElement("button");
          slotBtn.classList.add("slot-btn");
          slotBtn.innerText = timeText;

          const slotDateTime = `${date}T${timeText}:00`;
          const slotData = allSlots.find(s => s.slot_datetime === slotDateTime && s.master_id === parseInt(selectedMasterId));
          
          // Проверяем занятость кабинета
          const isCabinetOccupied = isCabinetBusy(selectedCabinetId, slotDateTime, parseInt(selectedMasterId));

          if (slotData) {
              if(slotData.status === "Ожидание") {
                  slotBtn.classList.add("waiting");
                  slotBtn.innerText = timeText + " — ожидание подтверждения";
                  slotBtn.disabled = true;
              } else if(slotData.status === "Подтверждено") {
                  slotBtn.classList.add("confirmed");
                  slotBtn.innerText = timeText + " — подтверждено";
                  slotBtn.disabled = true;
              } else if(slotData.status === "Открыто") {
                  slotBtn.classList.add("opened");
                  slotBtn.innerText = timeText + " — уже открыто";
                  slotBtn.disabled = true;
              }
          } else if (isCabinetOccupied) {
              slotBtn.classList.add("cabinet-busy");
              slotBtn.innerText = timeText + " — кабинет занят";
              slotBtn.disabled = true;
          } else {
              // Проверяем, не прошедшее ли это время
              const slotTime = new Date(slotDateTime);
              if (slotTime <= now) {
                  slotBtn.classList.add("past");
                  slotBtn.innerText = timeText + " — время прошло";
                  slotBtn.disabled = true;
              } else {
                  slotBtn.addEventListener("click", () => {
                      if(selectedSlots.has(timeText)) {
                          selectedSlots.delete(timeText);
                          slotBtn.classList.remove("selected");
                      } else {
                          selectedSlots.add(timeText);
                          slotBtn.classList.add("selected");
                      }
                  });
              }
          }

          slotsContainer.appendChild(slotBtn);
      });
  }

  function updateCabinetStatus(date) {
      // Проверяем занятость кабинета на выбранный день
      const cabinetMasters = masters.filter(m => m.cabinet_id === parseInt(selectedCabinetId));
      const cabinetMasterIds = cabinetMasters.map(m => m.id);
      
      const daySlots = allSlots.filter(slot => {
          const slotDate = slot.slot_datetime.split('T')[0];
          return slotDate === date && 
                 cabinetMasterIds.includes(slot.master_id) &&
                 (slot.status === "Подтверждено" || slot.status === "Ожидание");
      });
      
      if (daySlots.length > 0) {
          cabinetStatus.innerHTML = `
              <div class="cabinet-warning">
                  ⚠️ В этот день кабинет занят в ${daySlots.length} слотах
              </div>
          `;
      } else {
          cabinetStatus.innerHTML = `
              <div class="cabinet-free">
                  ✅ Кабинет свободен весь день
              </div>
          `;
      }
  }

  function formatDisplayDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
      });
  }

  function showMessage(message) {
      if (window.Telegram && window.Telegram.WebApp) {
          try {
              if (typeof window.Telegram.WebApp.showAlert === 'function') {
                  window.Telegram.WebApp.showAlert(message);
              } else if (typeof window.Telegram.WebApp.showPopup === 'function') {
                  window.Telegram.WebApp.showPopup({
                      title: 'Уведомление',
                      message: message,
                      buttons: [{ type: 'ok' }]
                  });
              } else {
                  alert(message);
              }
          } catch (e) {
              alert(message);
          }
      } else {
          alert(message);
      }
  }

  saveButton.addEventListener("click", () => {
      if(!selectedCabinetId || !selectedMasterId) {
          showMessage("Сначала выберите кабинет и мастера!");
          return;
      }
      
      if(!selectedDate || selectedSlots.size === 0){
          showMessage("Выберите дату и хотя бы один слот!");
          return;
      }
      
      const slotsArray = Array.from(selectedSlots);
      const selectedMaster = masters.find(m => m.id === parseInt(selectedMasterId));
      const selectedCabinet = cabinets.find(c => c.id === parseInt(selectedCabinetId));
      
      const payload = JSON.stringify({
          action: "admin_create_slots",
          date: selectedDate,
          times: slotsArray,
          master_id: selectedMasterId,
          master_name: selectedMaster ? selectedMaster.name : 'Неизвестный мастер',
          cabinet_id: selectedCabinetId,
          cabinet_name: selectedCabinet ? selectedCabinet.title : 'Неизвестный кабинет'
      });

      console.log("Отправляем данные в Telegram:", payload);
      
      // Отправляем данные в бота
      tg.sendData(payload);
      showMessage(`Слоты сохранены! Открыто ${slotsArray.length} записей для мастера ${selectedMaster ? selectedMaster.name : ''}`);
      
      // Обновляем данные
      loadAllSlots();
      selectedSlots.clear();
      slotsContainer.innerHTML = '';
      slotsEl.style.display = 'none';
  });

  // Обработчики событий
  cabinetSelect.addEventListener('change', (e) => {
      selectedCabinetId = e.target.value;
      if (selectedCabinetId) {
          loadMasters(parseInt(selectedCabinetId));
      } else {
          masters = [];
          populateMasterSelect();
          selectedMasterId = null;
          slotsEl.style.display = 'none';
      }
  });

  masterSelect.addEventListener('change', (e) => {
      selectedMasterId = e.target.value;
      if (selectedMasterId) {
          // Сбрасываем выбранную дату при смене мастера
          selectedDate = null;
          document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
          slotsEl.style.display = 'none';
      }
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
      slotsEl.style.display = 'none';
  });
  
  document.getElementById("nextMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
      slotsEl.style.display = 'none';
  });

  // Инициализация календаря
  renderCalendar(currentDate);

}
