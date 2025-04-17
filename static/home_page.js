        document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const taskInput = document.getElementById('taskInput');
            const taskDueDate = document.getElementById('taskDueDate');
            const taskPriority = document.getElementById('taskPriority');
            const addTaskBtn = document.getElementById('addTaskBtn');
            const taskList = document.getElementById('taskList');
            const emptyTasks = document.getElementById('emptyTasks');
            const categoryItems = document.querySelectorAll('.category-item');
            const taskTitle = document.querySelector('.task-title');
            const completedValue = document.querySelector('.stat-value');
            const totalValue = document.querySelectorAll('.stat-value')[0];
            const dueTodayValue = document.querySelectorAll('.stat-value')[2];
            const searchInput = document.getElementById('searchInput');
            const addCategory = document.getElementById('addCategory');
            const darkModeToggle = document.getElementById('darkModeToggle');
            const sortTasks = document.getElementById('sortTasks');
            
            // Initial sample tasks
            const initialTasks = [
                { id: 1, text: 'Complete the project proposal', completed: false, category: 'Work', dueDate: '2025-04-20', priority: 'high' },
                { id: 2, text: 'Buy groceries for the week', completed: true, category: 'Shopping', dueDate: '2025-04-15', priority: 'medium' },
                { id: 3, text: 'Finish reading chapter 5', completed: false, category: 'Study', dueDate: '2025-04-17', priority: 'medium' },
                { id: 4, text: 'Schedule dentist appointment', completed: false, category: 'Personal', dueDate: '2025-04-16', priority: 'low' },
                { id: 5, text: 'Pay utility bills', completed: true, category: 'Personal', dueDate: '2025-04-14', priority: 'high' }
            ];
            
            // Store tasks in localStorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || initialTasks;
            
            // Current filter
            let currentFilter = 'All Tasks';
            
            // Update stats
            function updateStats() {
                const completed = tasks.filter(task => task.completed).length;
                const total = tasks.length;
                const today = new Date().toISOString().split('T')[0];
                const dueToday = tasks.filter(task => task.dueDate === today && !task.completed).length;
                
                totalValue.textContent = total;
                completedValue.textContent = completed;
                dueTodayValue.textContent = dueToday;
            }
            
            // Render tasks
            function renderTasks(filteredTasks = tasks) {
                // Filter tasks
                let filteredTasksByCategory = filteredTasks;
                if (currentFilter !== 'All Tasks') {
                    filteredTasksByCategory = filteredTasks.filter(task => task.category === currentFilter);
                }
                
                // Clear task list
                taskList.innerHTML = '';
                
                // Check if there are tasks
                if (filteredTasksByCategory.length === 0) {
                    emptyTasks.style.display = 'block';
                } else {
                    emptyTasks.style.display = 'none';
                    
                    // Render tasks
                    filteredTasksByCategory.forEach(task => {
                        const taskItem = document.createElement('li');
                        taskItem.classList.add('task-item');
                        taskItem.dataset.id = task.id;
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.classList.add('task-checkbox');
                        checkbox.checked = task.completed;
                        
                        const priorityLabel = getPriorityLabel(task.priority);
                        
                        const today = new Date().toISOString().split('T')[0];
                        const isDueToday = task.dueDate === today ? ' <span style="color: var(--danger);">(Today)</span>' : '';
                        
                        taskItem.innerHTML = `
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                            <div class="task-content">
                                <div class="task-text">${task.text}</div>
                                <div class="task-meta">
                                    <div class="task-category">
                                        <span class="category-icon">${getCategoryIcon(task.category)}</span>
                                        ${task.category}
                                    </div>
                                    <div class="task-due">
                                        <span>📅</span>
                                        ${formatDate(task.dueDate)}${isDueToday}
                                    </div>
                                    <div class="priority-badge priority-${task.priority}">${priorityLabel}</div>
                                </div>
                            </div>
                            <div class="task-actions">
                                <button class="action-btn edit-btn">✏️</button>
                                <button class="action-btn delete-btn">🗑️</button>
                            </div>
                        `;
                        
                        // Get checkbox
                        const taskCheckbox = taskItem.querySelector('.task-checkbox');
                        
                        // Add event listener for checkbox
                        taskCheckbox.addEventListener('change', function() {
                            toggleTaskCompletion(task.id);
                        });
                        
                        // Add event listener for delete button
                        const deleteBtn = taskItem.querySelector('.delete-btn');
                        deleteBtn.addEventListener('click', function() {
                            deleteTask(task.id);
                        });
                        
                        // Add the task item to the list
                        taskList.appendChild(taskItem);
                    });
                }
                
                // Update stats
                updateStats();
            }
            
            // Get category icon
            function getCategoryIcon(category) {
                switch(category) {
                    case 'Work': return '💼';
                    case 'Personal': return '🏠';
                    case 'Study': return '🎓';
                    case 'Shopping': return '🛒';
                    default: return '📋';
                }
            }
            
            // Get priority label
            function getPriorityLabel(priority) {
                switch(priority) {
                    case 'high': return 'High';
                    case 'medium': return 'Medium';
                    case 'low': return 'Low';
                    default: return 'Medium';
                }
            }
            
            // Format date
            function formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            
            // Toggle task completion
            function toggleTaskCompletion(taskId) {
                tasks = tasks.map(task => {
                    if (task.id === taskId) {
                        return { ...task, completed: !task.completed };
                    }
                    return task;
                });
                
                // Save to localStorage
                localStorage.setItem('tasks', JSON.stringify(tasks));
                
                // Render tasks
                renderTasks();
            }
            
            // Delete task
            function deleteTask(taskId) {
                tasks = tasks.filter(task => task.id !== taskId);
                
                // Save to localStorage
                localStorage.setItem('tasks', JSON.stringify(tasks));
                
                // Render tasks
                renderTasks();
            }
            
            // Add new task
            function addTask() {
                const text = taskInput.value.trim();
                const dueDate = taskDueDate.value;
                const priority = taskPriority.value;

                if (text !== '') {
                    const newTask = {
                        id: Date.now(),
                        text: text,
                        completed: false,
                        category: currentFilter === 'All Tasks' ? 'Personal' : currentFilter,
                        dueDate: dueDate || new Date().toISOString().split('T')[0],
                        priority: priority || 'medium'
                    };

                    tasks.push(newTask);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    taskInput.value = '';
                    taskDueDate.value = '';
                    taskPriority.value = 'medium';
                    renderTasks();
                }
            }
            
            // Add task event listener
            addTaskBtn.addEventListener('click', addTask);
            
            // Add task on Enter key
            taskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
            
            // Category filter
            categoryItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Remove active class from all items
                    categoryItems.forEach(item => item.classList.remove('active'));
                    
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Update current filter
                    currentFilter = this.textContent.trim();
                    if (currentFilter.includes('Add Category')) {
                        // Show add category dialog (to be implemented)
                        currentFilter = 'All Tasks';
                    }
                    
                    // Update task title
                    taskTitle.textContent = currentFilter;
                    
                    // Render tasks
                    renderTasks();
                });
            });
            
            // Search tasks
            searchInput.addEventListener('input', function () {
                const query = searchInput.value.toLowerCase();
                const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(query));
                renderTasks(filteredTasks);
            });
            
            // Add new category
            addCategory.addEventListener('click', function () {
                const newCategory = prompt('Enter new category name:');
                if (newCategory) {
                    const categoryItem = document.createElement('li');
                    categoryItem.classList.add('category-item');
                    categoryItem.innerHTML = `<span class="category-icon">📋</span> ${newCategory}`;
                    document.querySelector('.categories').appendChild(categoryItem);

                    categoryItem.addEventListener('click', function () {
                        currentFilter = newCategory;
                        renderTasks();
                    });
                }
            });

            darkModeToggle.addEventListener('click', function () {
                document.body.classList.toggle('dark-mode');
            });

            sortTasks.addEventListener('change', function () {
                const sortBy = sortTasks.value;

                tasks.sort((a, b) => {
                    if (sortBy === 'dueDate') {
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    } else if (sortBy === 'priority') {
                        const priorityOrder = { high: 1, medium: 2, low: 3 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                });

                renderTasks();
            });

            // Initial render
            renderTasks();
        });

        // Add dark mode styles
        const darkModeStyles = `
            body.dark-mode {
                background-color: #1f2937;
                color: #f9fafb;
            }
            body.dark-mode .card {
                background-color: #374151;
            }
            body.dark-mode .btn {
                color: #f9fafb;
            }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = darkModeStyles;
        document.head.appendChild(styleSheet);

        function showTaskDetails(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('taskDetailsTitle').textContent = task.text;
                document.getElementById('taskDetailsDescription').textContent = `
                    Due Date: ${formatDate(task.dueDate)}
                    Priority: ${task.priority}
                    Category: ${task.category}
                `;
                document.getElementById('taskDetailsModal').style.display = 'block';
            }
        }

        document.getElementById('closeModal').addEventListener('click', function () {
            document.getElementById('taskDetailsModal').style.display = 'none';
        });

