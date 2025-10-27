export function renderManagement(container) {
  // Добавляем CSS файл
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-management.css';
  document.head.appendChild(link);

  container.innerHTML = `
    <div class="page">
      <h2>Управление категориями и услугами</h2>
      
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
  let selectedCategoryId = null;
  let selectedServiceId = null;
  let categories = [];
  let services = [];

  // Загрузка категорий
  loadCategories();

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

  async function loadCategories() {
    try {
      const response = await fetch('https://antohabeuty.store/api/api/categories');
      if (response.ok) {
        categories = await response.json();
      } else {
        console.error('Ошибка загрузки категорий');
        categories = [];
        tg.showAlert('Ошибка загрузки категорий');
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      categories = [];
      tg.showAlert('Ошибка загрузки категорий');
    }
  }

  async function loadServices(categoryId = null) {
    try {
      let url = 'https://antohabeuty.store/api/api/services';
      if (categoryId) {
        url += `/${categoryId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        services = await response.json();
      } else {
        console.error('Ошибка загрузки услуг');
        services = [];
        if (currentAction === 'delete-service') {
          tg.showAlert('Ошибка загрузки услуг');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      services = [];
      if (currentAction === 'delete-service') {
        tg.showAlert('Ошибка загрузки услуг');
      }
    }
  }

  function showModal(action) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalConfirm = document.getElementById('modalConfirm');

    selectedCategoryId = null;
    selectedServiceId = null;

    switch (action) {
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

  function getCategoryForm() {
    return `
      <div class="form-group">
        <label for="categoryTitle">Название категории:</label>
        <input type="text" id="categoryTitle" placeholder="Введите название" required>
      </div>
      <div class="form-group">
        <label for="categoryDescription">Описание:</label>
        <textarea id="categoryDescription" placeholder="Введите описание (необязательно)"></textarea>
      </div>
    `;
  }

  function getCategoryList() {
    if (categories.length === 0) {
      return '<p>Нет доступных категорий</p>';
    }

    const categoriesHTML = categories.map(cat => `
      <div class="category-item" data-id="${cat.id}">
        <strong>${cat.title}</strong>
        ${cat.description ? `<br><small>${cat.description}</small>` : ''}
      </div>
    `).join('');

    return `
      <p>Выберите категорию для удаления:</p>
      <div class="categories-list" id="categoriesList">
        ${categoriesHTML}
      </div>
    `;
  }

  function getServiceForm() {
    if (categories.length === 0) {
      return '<p>Сначала создайте категории</p>';
    }

    const categoriesOptions = categories.map(cat => 
      `<option value="${cat.id}">${cat.title}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label for="serviceTitle">Название услуги:</label>
        <input type="text" id="serviceTitle" placeholder="Введите название" required>
      </div>
      <div class="form-group">
        <label for="serviceDescription">Описание:</label>
        <textarea id="serviceDescription" placeholder="Введите описание (необязательно)"></textarea>
      </div>
      <div class="form-group">
        <label for="servicePrice">Цена (руб):</label>
        <input type="number" id="servicePrice" placeholder="Введите цену" required min="0">
      </div>
      <div class="form-group">
        <label for="serviceDuration">Длительность (минуты):</label>
        <input type="number" id="serviceDuration" placeholder="Введите длительность" required min="1">
      </div>
      <div class="form-group">
        <label for="serviceCategory">Категория:</label>
        <select id="serviceCategory" required>
          <option value="">Выберите категорию</option>
          ${categoriesOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="serviceContraindications">Противопоказания:</label>
        <textarea id="serviceContraindications" placeholder="Введите противопоказания (необязательно)"></textarea>
      </div>
    `;
  }

  function getServiceSelectionForm() {
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
        <label>Выберите услугу:</label>
        <div class="services-list" id="servicesList">
          <p class="no-services">Сначала выберите категорию</p>
        </div>
      </div>
    `;
  }

  async function handleConfirm() {
    const payload = {
      action: currentAction
    };

    switch (currentAction) {
      case 'create-category':
        const title = document.getElementById('categoryTitle').value;
        const description = document.getElementById('categoryDescription').value;
        
        if (!title) {
          tg.showAlert('Введите название категории!');
          return;
        }

        payload.title = title;
        if (description) payload.description = description;
        break;

      case 'delete-category':
        if (!selectedCategoryId) {
          tg.showAlert('Выберите категорию для удаления!');
          return;
        }
        payload.category_id = selectedCategoryId;
        break;

      case 'create-service':
        const serviceTitle = document.getElementById('serviceTitle').value;
        const serviceDescription = document.getElementById('serviceDescription').value;
        const servicePrice = document.getElementById('servicePrice').value;
        const serviceDuration = document.getElementById('serviceDuration').value;
        const serviceCategory = document.getElementById('serviceCategory').value;
        const serviceContraindications = document.getElementById('serviceContraindications').value;

        if (!serviceTitle || !servicePrice || !serviceDuration || !serviceCategory) {
          tg.showAlert('Заполните все обязательные поля!');
          return;
        }

        payload.title = serviceTitle;
        payload.price = parseInt(servicePrice);
        payload.durationMinutes = parseInt(serviceDuration);
        payload.category_id = parseInt(serviceCategory);
        
        if (serviceDescription) payload.description = serviceDescription;
        if (serviceContraindications) payload.contraindications = serviceContraindications;
        break;

      case 'delete-service':
        if (!selectedServiceId) {
          tg.showAlert('Выберите услугу для удаления!');
          return;
        }
        payload.service_id = selectedServiceId;
        break;
    }

    console.log("Отправляем данные в Telegram:", payload);
    tg.sendData(JSON.stringify(payload));
    tg.showAlert('Операция выполнена успешно!');
    hideModal();
  }

  // Обработчик выбора категории
  document.addEventListener('click', (e) => {
    if (e.target.closest('.category-item')) {
      const categoryItem = e.target.closest('.category-item');
      const categoryId = parseInt(categoryItem.dataset.id);
      
      // Снимаем выделение со всех элементов
      document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Выделяем выбранный элемент
      categoryItem.classList.add('selected');
      selectedCategoryId = categoryId;
      
      // Активируем кнопку подтверждения
      document.getElementById('modalConfirm').disabled = false;
    }

    if (e.target.closest('.service-item')) {
      const serviceItem = e.target.closest('.service-item');
      const serviceId = parseInt(serviceItem.dataset.id);
      
      // Снимаем выделение со всех элементов
      document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Выделяем выбранный элемент
      serviceItem.classList.add('selected');
      selectedServiceId = serviceId;
      
      // Активируем кнопку подтверждения
      document.getElementById('modalConfirm').disabled = false;
    }
  });

  // Обработчик изменения выбора категории для услуг
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
  });
}