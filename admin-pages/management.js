export function renderManagement(container) {
  // Добавляем CSS файл
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-management.css';
  document.head.appendChild(link);

  container.innerHTML = `
    <div class="page">
      <h2>Управление салоном</h2>
      
      <div class="management-section">
        <h3>Кабинеты</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="create-cabinet">
            <span class="icon">➕</span>
            Создать кабинет
          </button>
          <button class="action-btn" data-action="delete-cabinet">
            <span class="icon">🗑️</span>
            Удалить кабинет
          </button>
        </div>
      </div>

      <div class="management-section">
        <h3>Мастера</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="create-master">
            <span class="icon">➕</span>
            Создать мастера
          </button>
          <button class="action-btn" data-action="delete-master">
            <span class="icon">🗑️</span>
            Удалить мастера
          </button>
        </div>
      </div>

      <div class="management-section">
        <h3>Категории</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="create-category">
            <span class="icon">➕</span>
            Создать категорию
          </button>
          <button class="action-btn" data-action="delete-category">
            <span class="icon">🗑️</span>
            Удалить категорию
          </button>
        </div>
      </div>

      <div class="management-section">
        <h3>Услуги</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="create-service">
            <span class="icon">➕</span>
            Создать услугу
          </button>
          <button class="action-btn" data-action="edit-service">
            <span class="icon">✏️</span>
            Редактировать услугу
          </button>
          <button class="action-btn" data-action="delete-service">
            <span class="icon">🗑️</span>
            Удалить услугу
          </button>
        </div>
      </div>

      <!-- Модальные окна -->
      <div id="modalOverlay" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h3 id="modalTitle">Операция</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body" id="modalBody"></div>
          <div class="modal-footer">
            <button class="btn-secondary" id="modalCancel">Отмена</button>
            <button class="btn-primary" id="modalConfirm">Подтвердить</button>
          </div>
        </div>
      </div>
    </div>
  `;

  initializeManagement();
}

function initializeManagement() {
  const tg = window.Telegram.WebApp;
  tg.ready();

  let currentAction = '';
  let selectedCabinetId = null;
  let selectedMasterId = null;
  let selectedCategoryId = null;
  let selectedServiceId = null;
  let cabinets = [];
  let masters = [];
  let categories = [];
  let services = [];
  let selectedCategories = [];
  let selectedMastersForService = [];
  let selectedServiceData = null; // Для хранения данных редактируемой услуги

  const API_BASE = 'https://antohabeuty.store/api/api';

  // Загрузка данных
  loadCabinets();
  loadCategories();
  loadMasters();
  loadServices();

  // Обработчики кнопок действий
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      currentAction = action;
      showModal(action);
    });
  });

  // Закрытие модального окна
  document.getElementById('modalCancel').addEventListener('click', hideModal);
  document.querySelector('.modal-close').addEventListener('click', hideModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') hideModal();
  });

  async function loadCabinets() {
    try {
      const response = await fetch(`${API_BASE}/cabinets`);
      if (response.ok) {
        cabinets = await response.json();
      } else {
        console.error('Ошибка загрузки кабинетов');
        cabinets = [];
      }
    } catch (error) {
      console.error('Ошибка загрузки кабинетов:', error);
      cabinets = [];
    }
  }

  async function loadMasters(cabinetId = null) {
    try {
      let url = `${API_BASE}/masters`;
      if (cabinetId) {
        url = `${API_BASE}/cabinet/${cabinetId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        masters = await response.json();
      } else {
        console.error('Ошибка загрузки мастеров');
        masters = [];
      }
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
      masters = [];
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        categories = await response.json();
      } else {
        console.error('Ошибка загрузки категорий');
        categories = [];
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      categories = [];
    }
  }

  async function loadServices(categoryId = null) {
    try {
      let url = `${API_BASE}/services`;
      if (categoryId) {
        url = `${API_BASE}/services/${categoryId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        services = await response.json();
      } else {
        console.error('Ошибка загрузки услуг');
        services = [];
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      services = [];
    }
  }

  // Функция для получения услуг по категории (чтобы найти конкретную услугу)
  async function getServicesByCategory(categoryId) {
    try {
      const response = await fetch(`${API_BASE}/services/${categoryId}`);
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Ошибка загрузки услуг категории');
        return [];
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг категории:', error);
      return [];
    }
  }

  // Функция для поиска услуги по ID во всех категориях
  async function findServiceById(serviceId) {
    try {
      // Сначала загружаем все услуги
      const response = await fetch(`${API_BASE}/services`);
      if (response.ok) {
        const allServices = await response.json();
        // Находим услугу по ID
        return allServices.find(service => service.id === parseInt(serviceId));
      }
      return null;
    } catch (error) {
      console.error('Ошибка поиска услуги:', error);
      return null;
    }
  }

  // Функция для получения мастеров услуги (предполагаю, что есть такой API)
  async function getServiceMasters(serviceId) {
    try {
      // Этот эндпоинт нужно проверить - возможно он другой
      const response = await fetch(`${API_BASE}/service/${serviceId}/masters`);
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Ошибка загрузки мастеров услуги');
        return [];
      }
    } catch (error) {
      console.error('Ошибка загрузки мастеров услуги:', error);
      return [];
    }
  }

  function sendTelegramData(data) {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
      return true;
    } else {
      console.error('Telegram WebApp не доступен');
      return false;
    }
  }

  function showModal(action) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalConfirm = document.getElementById('modalConfirm');

    // Сбрасываем выбранные значения
    selectedCabinetId = null;
    selectedMasterId = null;
    selectedCategoryId = null;
    selectedServiceId = null;
    selectedCategories = [];
    selectedMastersForService = [];
    selectedServiceData = null;

    switch (action) {
      case 'create-cabinet':
        modalTitle.textContent = 'Создание кабинета';
        modalBody.innerHTML = getCabinetForm();
        modalConfirm.textContent = 'Создать';
        modalConfirm.disabled = false;
        break;

      case 'delete-cabinet':
        modalTitle.textContent = 'Удаление кабинета';
        modalBody.innerHTML = getCabinetList();
        modalConfirm.textContent = 'Удалить';
        modalConfirm.disabled = true;
        break;

      case 'create-master':
        modalTitle.textContent = 'Создание мастера';
        modalBody.innerHTML = getMasterForm();
        modalConfirm.textContent = 'Создать';
        modalConfirm.disabled = false;
        break;

      case 'delete-master':
        modalTitle.textContent = 'Удаление мастера';
        modalBody.innerHTML = getMasterSelectionForm();
        modalConfirm.textContent = 'Удалить';
        modalConfirm.disabled = true;
        break;

      case 'create-category':
        modalTitle.textContent = 'Создание категории';
        modalBody.innerHTML = getCategoryForm();
        modalConfirm.textContent = 'Создать';
        modalConfirm.disabled = false;
        break;

      case 'delete-category':
        modalTitle.textContent = 'Удаление категории';
        modalBody.innerHTML = getCategoryList();
        modalConfirm.textContent = 'Удалить';
        modalConfirm.disabled = true;
        break;

      case 'create-service':
        modalTitle.textContent = 'Создание услуги';
        modalBody.innerHTML = getServiceForm();
        modalConfirm.textContent = 'Создать';
        modalConfirm.disabled = false;
        break;

      case 'edit-service':
        modalTitle.textContent = 'Редактирование услуги';
        modalBody.innerHTML = getServiceSelectionForm('edit');
        modalConfirm.textContent = 'Редактировать';
        modalConfirm.disabled = true;
        break;

      case 'delete-service':
        modalTitle.textContent = 'Удаление услуги';
        modalBody.innerHTML = getServiceSelectionForm();
        modalConfirm.textContent = 'Удалить';
        modalConfirm.disabled = true;
        break;
    }

    modalConfirm.onclick = handleConfirm;
    document.getElementById('modalOverlay').style.display = 'flex';
  }

  function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
  }

  // Общая функция для формы выбора услуги
  function getServiceSelectionForm(mode = 'delete') {
    if (categories.length === 0) {
      return '<p>Нет доступных категорий</p>';
    }

    const categoriesOptions = categories.map(cat => 
      `<option value="${cat.id}">${cat.title}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label for="serviceCategorySelect">Выберите категорию:</label>
        <select id="serviceCategorySelect">
          <option value="">Выберите категорию</option>
          ${categoriesOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Выберите услугу${mode === 'edit' ? ' для редактирования' : ' для удаления'}:</label>
        <div class="services-list" id="servicesList">
          <p class="no-services">Сначала выберите категорию</p>
        </div>
      </div>
    `;
  }

  // Функция для формы редактирования услуги
  function getEditServiceForm(serviceData, serviceMasters = []) {
    const categoriesOptions = categories.map(cat => 
      `<option value="${cat.id}" ${serviceData.category_id === cat.id ? 'selected' : ''}>${cat.title}</option>`
    ).join('');

    // Получаем ID мастеров, привязанных к услуге
    const serviceMasterIds = serviceMasters.map(master => master.id);
    
    const mastersCheckboxes = masters.map(master => 
      `<div class="checkbox-item">
        <input type="checkbox" id="master-${master.id}" value="${master.id}" class="master-checkbox" ${serviceMasterIds.includes(master.id) ? 'checked' : ''}>
        <label for="master-${master.id}">${master.name}</label>
      </div>`
    ).join('');

    return `
      <div class="form-group">
        <label for="serviceTitle">Название услуги:</label>
        <input type="text" id="serviceTitle" placeholder="Введите название" value="${serviceData.title || ''}" required>
      </div>
      <div class="form-group">
        <label for="serviceDescription">Описание:</label>
        <textarea id="serviceDescription" placeholder="Введите описание" rows="2">${serviceData.description || ''}</textarea>
      </div>
      <div class="form-group">
        <div class="form-row">
          <div class="form-col">
            <label for="servicePrice">Цена (руб):</label>
            <input type="number" id="servicePrice" placeholder="Цена" value="${serviceData.price || 0}" required min="0">
          </div>
          <div class="form-col">
            <label for="serviceDuration">Длительность (мин):</label>
            <input type="number" id="serviceDuration" placeholder="Мин" value="${serviceData.durationMinutes || 30}" required min="1">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="serviceCategory">Категория:</label>
        <select id="serviceCategory" required>
          <option value="">Выберите категорию</option>
          ${categoriesOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Мастера:</label>
        <small class="form-hint">Выберите мастеров для этой услуги</small>
        <div class="categories-checkbox-group" id="mastersCheckboxGroup">
          ${mastersCheckboxes}
        </div>
      </div>
    `;
  }

  async function handleConfirm() {
    const showMessage = (message) => {
      try {
        if (window.Telegram && window.Telegram.WebApp) {
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
        } else {
          alert(message);
        }
      } catch (e) {
        alert(message);
      }
    };
    
    try {
      let response;
      
      switch (currentAction) {
        // ... существующие обработчики ...

        case 'create-service':
          const serviceTitle = document.getElementById('serviceTitle').value;
          const serviceDescription = document.getElementById('serviceDescription').value;
          const servicePrice = document.getElementById('servicePrice').value;
          const serviceDuration = document.getElementById('serviceDuration').value;
          const serviceCategory = document.getElementById('serviceCategory').value;

          if (!serviceTitle || !servicePrice || !serviceDuration || !serviceCategory) {
            showMessage('Заполните все обязательные поля!');
            return;
          }

          const serviceData = {
            action: "create-service",
            title: serviceTitle,
            description: serviceDescription || null,
            price: parseInt(servicePrice),
            durationMinutes: parseInt(serviceDuration),
            category_id: parseInt(serviceCategory),
            master_ids: selectedMastersForService
          };

          if (sendTelegramData(serviceData)) {
            showMessage('Данные отправлены в Telegram!');
            await loadServices();
          } else {
            throw new Error('Не удалось отправить данные через Telegram WebApp');
          }
          break;

        case 'edit-service':
          if (!selectedServiceId) {
            showMessage('Выберите услугу для редактирования!');
            return;
          }

          // Получаем данные из формы редактирования
          const editServiceTitle = document.getElementById('serviceTitle').value;
          const editServiceDescription = document.getElementById('serviceDescription').value;
          const editServicePrice = document.getElementById('servicePrice').value;
          const editServiceDuration = document.getElementById('serviceDuration').value;
          const editServiceCategory = document.getElementById('serviceCategory').value;

          if (!editServiceTitle || !editServicePrice || !editServiceDuration || !editServiceCategory) {
            showMessage('Заполните все обязательные поля!');
            return;
          }

          const editServiceData = {
            action: "edit-service",
            service_id: selectedServiceId,
            title: editServiceTitle,
            description: editServiceDescription || null,
            price: parseInt(editServicePrice),
            durationMinutes: parseInt(editServiceDuration),
            category_id: parseInt(editServiceCategory),
            master_ids: selectedMastersForService
          };

          if (sendTelegramData(editServiceData)) {
            showMessage('Данные для редактирования отправлены в Telegram!');
            await loadServices();
          } else {
            throw new Error('Не удалось отправить данные через Telegram WebApp');
          }
          break;

        case 'delete-service':
          if (!selectedServiceId) {
            showMessage('Выберите услугу для удаления!');
            return;
          }

          const deleteServiceData = {
            action: "delete-service",
            service_id: selectedServiceId
          };

          if (sendTelegramData(deleteServiceData)) {
            showMessage('Запрос на удаление отправлен в Telegram!');
            await loadServices();
          } else {
            throw new Error('Не удалось отправить данные через Telegram WebApp');
          }
          break;
      }

      hideModal();
      
    } catch (error) {
      console.error('Ошибка выполнения операции:', error);
      showMessage(`Ошибка: ${error.message}`);
    }
  }

  // Обработчики выбора элементов
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.cabinet-item')) {
      const item = e.target.closest('.cabinet-item');
      selectedCabinetId = parseInt(item.dataset.id);
      updateSelection('.cabinet-item', item);
      document.getElementById('modalConfirm').disabled = false;
    }
    
    if (e.target.closest('.master-item')) {
      const item = e.target.closest('.master-item');
      selectedMasterId = parseInt(item.dataset.id);
      updateSelection('.master-item', item);
      document.getElementById('modalConfirm').disabled = false;
    }
    
    if (e.target.closest('.category-item')) {
      const item = e.target.closest('.category-item');
      selectedCategoryId = parseInt(item.dataset.id);
      updateSelection('.category-item', item);
      document.getElementById('modalConfirm').disabled = false;
    }
    
    if (e.target.closest('.service-item')) {
      const item = e.target.closest('.service-item');
      selectedServiceId = parseInt(item.dataset.id);
      updateSelection('.service-item', item);
      
      // Для редактирования услуги нужно загрузить данные
      if (currentAction === 'edit-service') {
        await loadServiceForEdit(selectedServiceId);
      }
      
      document.getElementById('modalConfirm').disabled = false;
    }
  });

  async function loadServiceForEdit(serviceId) {
    try {
      const modalBody = document.getElementById('modalBody');
      modalBody.innerHTML = '<p class="loading">Загрузка данных услуги...</p>';
      
      // Ищем услугу по ID
      const serviceData = await findServiceById(serviceId);
      if (!serviceData) {
        modalBody.innerHTML = '<p class="error">Ослуга не найдена</p>';
        return;
      }
      
      // Пытаемся получить мастеров для услуги
      let serviceMasters = [];
      try {
        serviceMasters = await getServiceMasters(serviceId);
      } catch (error) {
        console.log('Не удалось загрузить мастеров услуги, используем пустой список');
      }
      
      // Устанавливаем выбранных мастеров
      selectedMastersForService = serviceMasters.map(master => master.id);
      
      // Отображаем форму редактирования
      modalBody.innerHTML = getEditServiceForm(serviceData, serviceMasters);
      selectedServiceData = serviceData;
      
    } catch (error) {
      console.error('Ошибка загрузки данных услуги:', error);
      modalBody.innerHTML = '<p class="error">Ошибка загрузки данных услуги</p>';
    }
  }

  function updateSelection(selector, selectedItem) {
    document.querySelectorAll(selector).forEach(item => {
      item.classList.remove('selected');
    });
    selectedItem.classList.add('selected');
  }

  // Обработчики изменения выбора для динамических списков
  document.addEventListener('change', async (e) => {
    if (e.target.id === 'serviceCategorySelect') {
      const categoryId = e.target.value;
      const servicesList = document.getElementById('servicesList');
      
      if (!categoryId) {
        servicesList.innerHTML = '<p class="no-services">Сначала выберите категорию</p>';
        return;
      }
      
      servicesList.innerHTML = '<p class="loading">Загрузка услуг...</p>';
      await loadServices(categoryId);
      
      if (services.length === 0) {
        servicesList.innerHTML = '<p class="no-services">В этой категории нет услуг</p>';
      } else {
        const actionMode = currentAction.includes('edit') ? 'edit' : 'delete';
        const servicesHTML = services.map(service => `
          <div class="service-item" data-id="${service.id}">
            <div><strong>${service.title}</strong></div>
            <div class="service-details">
              <small>Цена: ${service.price} руб.</small>
              <small>Длительность: ${service.durationMinutes} мин.</small>
              ${service.description ? `<small>Описание: ${service.description}</small>` : ''}
            </div>
          </div>
        `).join('');
        
        servicesList.innerHTML = servicesHTML;
      }
      
      selectedServiceId = null;
      document.getElementById('modalConfirm').disabled = true;
    }

    // Обработчик для чекбоксов мастеров при создании/редактировании услуги
    if (e.target.classList.contains('master-checkbox')) {
      const masterId = parseInt(e.target.value);
      const isChecked = e.target.checked;
      
      if (isChecked) {
        if (!selectedMastersForService.includes(masterId)) {
          selectedMastersForService.push(masterId);
        }
      } else {
        selectedMastersForService = selectedMastersForService.filter(id => id !== masterId);
      }
    }
  });
}
