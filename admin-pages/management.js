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
            Создать категориу
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
  let selectedCabinetId = null;
  let selectedMasterId = null;
  let selectedCategoryId = null;
  let selectedServiceId = null;
  let cabinets = [];
  let masters = [];
  let categories = [];
  let services = [];

  // Базовый URL API
  //const API_BASE = 'http://localhost:8000/api';
  const API_BASE = 'https://antohabeuty.store/api';

  // Загрузка данных
  loadCabinets();
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
        url += `/${categoryId}`;
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

  function showModal(action) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalConfirm = document.getElementById('modalConfirm');

    // Сбрасываем выбранные значения
    selectedCabinetId = null;
    selectedMasterId = null;
    selectedCategoryId = null;
    selectedServiceId = null;

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

  function getCabinetForm() {
    return `
      <div class="form-group">
        <label for="cabinetTitle">Название кабинета:</label>
        <input type="text" id="cabinetTitle" placeholder="Введите название" required>
      </div>
    `;
  }

  function getCabinetList() {
    if (cabinets.length === 0) {
      return '<p>Нет доступных кабинетов</p>';
    }

    const cabinetsHTML = cabinets.map(cabinet => `
      <div class="cabinet-item" data-id="${cabinet.id}">
        <strong>${cabinet.title}</strong>
        <small>Мастеров: ${cabinet.masters_count || 0}</small>
      </div>
    `).join('');

    return `
      <p>Выберите кабинет для удаления:</p>
      <div class="cabinets-list" id="cabinetsList">
        ${cabinetsHTML}
      </div>
    `;
  }

  function getMasterForm() {
    if (cabinets.length === 0) {
      return '<p>Сначала создайте кабинеты</p>';
    }

    const cabinetsOptions = cabinets.map(cabinet => 
      `<option value="${cabinet.id}">${cabinet.title}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label for="masterName">Имя мастера:</label>
        <input type="text" id="masterName" placeholder="Введите имя" required>
      </div>
      <div class="form-group">
        <label for="masterSpecialization">Специализация:</label>
        <input type="text" id="masterSpecialization" placeholder="Введите специализацию">
      </div>
      <div class="form-group">
        <label for="masterDescription">Описание:</label>
        <textarea id="masterDescription" placeholder="Введите описание"></textarea>
      </div>
      <div class="form-group">
        <label for="masterCabinet">Кабинет:</label>
        <select id="masterCabinet" required>
          <option value="">Выберите кабинет</option>
          ${cabinetsOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="masterPhoto">Фото (URL):</label>
        <input type="text" id="masterPhoto" placeholder="Введите URL фото">
      </div>
    `;
  }

  function getMasterSelectionForm() {
    if (cabinets.length === 0) {
      return '<p>Нет доступных кабинетов</p>';
    }

    const cabinetsOptions = cabinets.map(cabinet => 
      `<option value="${cabinet.id}">${cabinet.title}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label for="masterCabinetSelect">Выберите кабинет:</label>
        <select id="masterCabinetSelect">
          <option value="">Выберите кабинет</option>
          ${cabinetsOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Выберите мастера:</label>
        <div class="masters-list" id="mastersList">
          <p class="no-masters">Сначала выберите кабинет</p>
        </div>
      </div>
    `;
  }

  function getCategoryForm() {
    return `
      <div class="form-group">
        <label for="categoryTitle">Название категории:</label>
        <input type="text" id="categoryTitle" placeholder="Введите название" required>
      </div>
      <div class="form-group">
        <label for="categoryDescription">Описание:</label>
        <textarea id="categoryDescription" placeholder="Введите описание"></textarea>
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
        <textarea id="serviceDescription" placeholder="Введите описание"></textarea>
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
        <textarea id="serviceContraindications" placeholder="Введите противопоказания"></textarea>
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
    // Функция для показа сообщений с fallback
    const showMessage = (message) => {
      try {
        // Пробуем использовать Telegram WebApp если доступно
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
        // Если Telegram метод не работает, используем alert
        alert(message);
      }
    };
    
    try {
      let response;
      
      switch (currentAction) {
        case 'create-cabinet':
          const cabinetTitle = document.getElementById('cabinetTitle').value;
          if (!cabinetTitle) {
            showMessage('Введите название кабинета!');
            return;
          }
          
          response = await fetch(`${API_BASE}/cabinets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: cabinetTitle })
          });
          
          if (response.ok) {
            showMessage('Кабинет успешно создан!');
            await loadCabinets();
          } else {
            const errorText = await response.text();
            throw new Error(`Ошибка создания кабинета: ${response.status} ${errorText}`);
          }
          break;

        case 'delete-cabinet':
          if (!selectedCabinetId) {
            showMessage('Выберите кабинет для удаления!');
            return;
          }
          
          response = await fetch(`${API_BASE}/cabinets/${selectedCabinetId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            showMessage('Кабинет успешно удален!');
            await loadCabinets();
          } else {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка удаления кабинета: ${response.status}`);
          }
          break;

        case 'create-master':
          const masterName = document.getElementById('masterName').value;
          const masterSpecialization = document.getElementById('masterSpecialization').value;
          const masterDescription = document.getElementById('masterDescription').value;
          const masterCabinet = document.getElementById('masterCabinet').value;
          const masterPhoto = document.getElementById('masterPhoto').value;

          if (!masterName || !masterCabinet) {
            showMessage('Заполните обязательные поля!');
            return;
          }

          response = await fetch(`${API_BASE}/masters`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: masterName,
              cabinet_id: parseInt(masterCabinet),
              specialization: masterSpecialization || null,
              description: masterDescription || null,
              photo: masterPhoto || null
            })
          });
          
          if (response.ok) {
            showMessage('Мастер успешно создан!');
            await loadMasters();
          } else {
            const errorText = await response.text();
            throw new Error(`Ошибка создания мастера: ${response.status} ${errorText}`);
          }
          break;

        case 'delete-master':
          if (!selectedMasterId) {
            showMessage('Выберите мастера для удаления!');
            return;
          }
          
          response = await fetch(`${API_BASE}/masters/${selectedMasterId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            showMessage('Мастер успешно удален!');
            await loadMasters();
          } else {
            let errorMessage = `Ошибка удаления мастера: ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } catch (e) {
              // Если не удалось распарсить JSON, используем текст ответа
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
          }
          break;

        case 'create-category':
          const categoryTitle = document.getElementById('categoryTitle').value;
          const categoryDescription = document.getElementById('categoryDescription').value;
          
          if (!categoryTitle) {
            showMessage('Введите название категории!');
            return;
          }

          response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: categoryTitle,
              description: categoryDescription || null
            })
          });
          
          if (response.ok) {
            showMessage('Категория успешно создана!');
            await loadCategories();
          } else {
            const errorText = await response.text();
            throw new Error(`Ошибка создания категории: ${response.status} ${errorText}`);
          }
          break;

        case 'delete-category':
          if (!selectedCategoryId) {
            showMessage('Выберите категорию для удаления!');
            return;
          }
          
          response = await fetch(`${API_BASE}/categories/${selectedCategoryId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            showMessage('Категория успешно удалена!');
            await loadCategories();
          } else {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка удаления категории: ${response.status}`);
          }
          break;

        case 'create-service':
          const serviceTitle = document.getElementById('serviceTitle').value;
          const serviceDescription = document.getElementById('serviceDescription').value;
          const servicePrice = document.getElementById('servicePrice').value;
          const serviceDuration = document.getElementById('serviceDuration').value;
          const serviceCategory = document.getElementById('serviceCategory').value;
          const serviceContraindications = document.getElementById('serviceContraindications').value;

          if (!serviceTitle || !servicePrice || !serviceDuration || !serviceCategory) {
            showMessage('Заполните все обязательные поля!');
            return;
          }

          response = await fetch(`${API_BASE}/services`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: serviceTitle,
              description: serviceDescription || null,
              price: parseInt(servicePrice),
              durationMinutes: parseInt(serviceDuration),
              category_id: parseInt(serviceCategory),
              contraindications: serviceContraindications || null
            })
          });
          
          if (response.ok) {
            showMessage('Услуга успешно создана!');
            await loadServices();
          } else {
            const errorText = await response.text();
            throw new Error(`Ошибка создания услуги: ${response.status} ${errorText}`);
          }
          break;

        case 'delete-service':
          if (!selectedServiceId) {
            showMessage('Выберите услугу для удаления!');
            return;
          }
          
          response = await fetch(`${API_BASE}/services/${selectedServiceId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            showMessage('Услуга успешно удалена!');
            await loadServices();
          } else {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка удаления услуги: ${response.status}`);
          }
          break;
      }

      showMessage('Операция выполнена успешно!');
      hideModal();
      
    } catch (error) {
      console.error('Ошибка выполнения операции:', error);
      showMessage(`Ошибка: ${error.message}`);
    }
  }

  // Обработчики выбора элементов
  document.addEventListener('click', (e) => {
    const selectors = {
      '.cabinet-item': () => {
        const item = e.target.closest('.cabinet-item');
        selectedCabinetId = parseInt(item.dataset.id);
        updateSelection('.cabinet-item', item);
      },
      '.master-item': () => {
        const item = e.target.closest('.master-item');
        selectedMasterId = parseInt(item.dataset.id);
        updateSelection('.master-item', item);
      },
      '.category-item': () => {
        const item = e.target.closest('.category-item');
        selectedCategoryId = parseInt(item.dataset.id);
        updateSelection('.category-item', item);
      },
      '.service-item': () => {
        const item = e.target.closest('.service-item');
        selectedServiceId = parseInt(item.dataset.id);
        updateSelection('.service-item', item);
      }
    };

    for (const [selector, handler] of Object.entries(selectors)) {
      if (e.target.closest(selector)) {
        handler();
        document.getElementById('modalConfirm').disabled = false;
        break;
      }
    }
  });

  function updateSelection(selector, selectedItem) {
    document.querySelectorAll(selector).forEach(item => {
      item.classList.remove('selected');
    });
    selectedItem.classList.add('selected');
  }

  // Обработчики изменения выбора для динамических списков
  document.addEventListener('change', async (e) => {
    if (e.target.id === 'masterCabinetSelect') {
      const cabinetId = e.target.value;
      const mastersList = document.getElementById('mastersList');
      
      if (!cabinetId) {
        mastersList.innerHTML = '<p class="no-masters">Сначала выберите кабинет</p>';
        return;
      }
      
      mastersList.innerHTML = '<p class="loading">Загрузка мастеров...</p>';
      await loadMasters(cabinetId);
      
      if (masters.length === 0) {
        mastersList.innerHTML = '<p class="no-masters">В этом кабинете нет мастеров</p>';
      } else {
        const mastersHTML = masters.map(master => `
          <div class="master-item" data-id="${master.id}">
            <div><strong>${master.name}</strong></div>
            <div class="master-details">
              <small>Специализация: ${master.specialization || 'не указана'}</small>
            </div>
          </div>
        `).join('');
        
        mastersList.innerHTML = mastersHTML;
      }
      
      selectedMasterId = null;
      document.getElementById('modalConfirm').disabled = true;
    }

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
