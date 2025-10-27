export function renderOpenBooking(container) {
  // Добавляем CSS файл
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-open-booking.css';
  document.head.appendChild(link);

  container.innerHTML = `
    <div class="page">
      <h2>Открыть запись</h2>
      <div class="controls">
        <button id="prevMonth">◀️</button>
        <div id="monthLabel"></div>
        <button id="nextMonth">▶️</button>
      </div>
      <div class="calendar" id="calendar"></div>
      <div class="slots" id="slots">
        <div id="slotsContainer"></div>
        <button id="saveSlots">Сохранить слоты</button>
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

  let currentDate = new Date();
  let selectedDate = null;
  let selectedSlots = new Set();

  const monthNames = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
  ];

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
      const now = new Date();

      let response;
      try {
          response = await fetch('https://antohabeuty.store/api/api/books/slots/');
          response = await response.json();
      } catch (err) {
          console.error('Ошибка получения слотов:', err);
          return;
      }

      const slotsForDay = response.filter(slot => slot.slot_datetime.startsWith(date));

      for(let hour=9; hour<=18; hour++){
          const slotBtn = document.createElement("button");
          slotBtn.classList.add("slot-btn");
          const timeText = `${String(hour).padStart(2,'0')}:00`;
          slotBtn.innerText = timeText;

          const slotData = slotsForDay.find(s => s.slot_datetime.endsWith(`T${timeText}:00`));

          if(slotData) {
              if(slotData.status === "Ожидание") {
                  slotBtn.classList.add("waiting");
                  slotBtn.innerText = timeText + " — занято, ожидание подтверждения";
              } else if(slotData.status === "Подтверждено") {
                  slotBtn.classList.add("confirmed");
                  slotBtn.innerText = timeText + " — занято, уже подтвердили";
              } else if(slotData.status === "Открыто") {
                  slotBtn.classList.add("opened");
                  slotBtn.innerText = timeText + " — запись уже открыта";
              }
          } else {
              if(dayDate.toDateString() === now.toDateString() && hour <= now.getHours()) {
                  slotBtn.classList.add("opened");
                  slotBtn.innerText = timeText + " — запись уже открыта";
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
      }
  }

  saveButton.addEventListener("click", () => {
      if(!selectedDate || selectedSlots.size === 0){
          tg.showAlert("Выберите дату и хотя бы один слот!");
          return;
      }
      const slotsArray = Array.from(selectedSlots);
      const payload = JSON.stringify({
          action: "admin_create_slots",
          date: selectedDate,
          times: slotsArray
      });

      console.log("Отправляем данные в Telegram:", payload);
      tg.sendData(payload);
      tg.close();
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
  });

  renderCalendar(currentDate);
}