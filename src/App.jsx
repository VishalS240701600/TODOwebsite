import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import './App.css'
import Sidebar from './components/Sidebar'

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode')
        return savedMode ? JSON.parse(savedMode) : false
    })
    const [notes, setNotes] = useState(() => {
        const savedNotes = localStorage.getItem('notes')
        return savedNotes ? JSON.parse(savedNotes) : {}
    })
    const [todos, setTodos] = useState(() => {
        const savedTodos = localStorage.getItem('todos')
        return savedTodos ? JSON.parse(savedTodos) : []
    })
    const [notifications, setNotifications] = useState(false)
    const [voiceInput, setVoiceInput] = useState(false)
    const [recognition, setRecognition] = useState(null)
    const [newTodo, setNewTodo] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [category, setCategory] = useState('all')
    const [newCategory, setNewCategory] = useState('')
    const [noteText, setNoteText] = useState('')

    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos))
        localStorage.setItem('notes', JSON.stringify(notes))
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
        document.body.className = darkMode ? 'dark-mode' : ''

        if (notifications) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    todos.forEach(todo => {
                        if (todo.dueTime) {
                            const [hours, minutes] = todo.dueTime.split(':')
                            const dueDate = new Date(todo.date)
                            dueDate.setHours(hours, minutes)

                            if (dueDate > new Date()) {
                                const timeUntilDue = dueDate.getTime() - new Date().getTime()
                                setTimeout(() => {
                                    new Notification('Task Due!', {
                                        body: `The task "${todo.text}" is due now!`,
                                        icon: '/favicon.ico'
                                    })
                                }, timeUntilDue)
                            }
                        }
                    })
                }
            })
        }
    }, [todos, notes, darkMode, notifications])

    const onDragEnd = (result) => {
        if (!result.destination) return
        const items = Array.from(todos)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)
        setTodos(items)
    }

    useEffect(() => {
        if (voiceInput && !recognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = false
                recognition.lang = 'en-US'
                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript
                    setNewTodo(text)
                }
                setRecognition(recognition)
            }
        }
    }, [voiceInput])

    const toggleDarkMode = () => setDarkMode(!darkMode)

    const toggleNotifications = () => setNotifications(!notifications)

    const toggleVoiceInput = () => {
        if (!voiceInput && recognition) {
            recognition.start()
        }
        setVoiceInput(!voiceInput)
    }

    const addNote = (todoId) => {
        if (!noteText.trim()) return
        setNotes({ ...notes, [todoId]: noteText })
        setNoteText('')
    }

    const addTodo = (e) => {
        e.preventDefault()
        if (!newTodo.trim() || !newCategory.trim()) return

        setTodos([...todos, {
            id: Date.now(),
            text: newTodo,
            completed: false,
            priority: 'medium',
            date: new Date().toISOString().split('T')[0],
            dueTime: '',
            category: newCategory,
            recurring: '',
            subtasks: [],
            progress: 0
        }])
        setNewTodo('')
        setNewCategory('')
    }

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id))
    }

    const setPriority = (id, priority) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, priority } : todo
        ))
    }

    const addSubtask = (todoId, subtaskText) => {
        if (!subtaskText.trim()) return
        setTodos(todos.map(todo =>
            todo.id === todoId
                ? {
                    ...todo,
                    subtasks: [...todo.subtasks, { id: Date.now(), text: subtaskText, completed: false }]
                }
                : todo
        ))
    }

    const toggleSubtask = (todoId, subtaskId) => {
        setTodos(todos.map(todo =>
            todo.id === todoId
                ? {
                    ...todo,
                    subtasks: todo.subtasks.map(subtask =>
                        subtask.id === subtaskId
                            ? { ...subtask, completed: !subtask.completed }
                            : subtask
                    ),
                    progress: calculateProgress(todo.subtasks)
                }
                : todo
        ))
    }

    const calculateProgress = (subtasks) => {
        if (subtasks.length === 0) return 0
        const completedSubtasks = subtasks.filter(subtask => subtask.completed).length
        return Math.round((completedSubtasks / subtasks.length) * 100)
    }

    const filteredTodos = todos
        .filter(todo => {
            const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase())

            if (category.startsWith('priority-')) {
                const priority = category.split('-')[1]
                return matchesSearch && todo.priority === priority
            } else if (category.startsWith('date-')) {
                const dateFilter = category.split('-')[1]
                const today = new Date()
                const todoDate = new Date(todo.date)

                switch (dateFilter) {
                    case 'today':
                        return matchesSearch && todoDate.toDateString() === today.toDateString()
                    case 'week':
                        const weekAgo = new Date(today.setDate(today.getDate() - 7))
                        return matchesSearch && todoDate >= weekAgo
                    case 'month':
                        const monthAgo = new Date(today.setMonth(today.getMonth() - 1))
                        return matchesSearch && todoDate >= monthAgo
                    default:
                        return matchesSearch
                }
            } else {
                const matchesCategory = category === 'all' || todo.category === category
                return matchesSearch && matchesCategory
            }
        })

    const categories = ['all', ...new Set(todos.map(todo => todo.category))]

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
                <Sidebar
                    darkMode={darkMode}
                    categories={categories}
                    category={category}
                    setCategory={setCategory}
                    todos={todos}
                    setTodos={setTodos}
                />
                <div className="main-content">
                    <div className="container">
                        <div className="header-section">
                            <h1>Enhanced Todo List</h1>
                            <div className="header-controls">
                                <button onClick={toggleNotifications} className="feature-toggle">
                                    {notifications ? '🔔 On' : '🔕 Off'}
                                </button>
                                <button onClick={toggleVoiceInput} className="feature-toggle">
                                    {voiceInput ? '🎤 On' : '🎤 Off'}
                                </button>
                                <button onClick={toggleDarkMode} className="theme-toggle">
                                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                                </button>
                            </div>
                        </div>
                        <div className="search-filter">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search todos..."
                                className="search-input"
                            />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="category-filter"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <form onSubmit={addTodo} className="todo-form">
                            <input
                                type="text"
                                value={newTodo}
                                onChange={(e) => setNewTodo(e.target.value)}
                                placeholder="Add a new task..."
                                className="todo-input"
                            />
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Add category..."
                                className="category-input"
                            />
                            <button type="submit" className="add-button">Add</button>
                        </form>

                        <Droppable droppableId="todos">
                            {(provided) => (
                                <div className="todo-list" {...provided.droppableProps} ref={provided.innerRef}>
                                    {filteredTodos.map((todo, index) => (
                                        <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.completed}
                                                        onChange={() => toggleTodo(todo.id)}
                                                    />
                                                    <span className="todo-text">{todo.text}</span>
                                                    <div className="todo-actions">
                                                        <select
                                                            value={todo.priority}
                                                            onChange={(e) => setPriority(todo.id, e.target.value)}
                                                            className="priority-select"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                        </select>
                                                        <span className="todo-category">{todo.category}</span>
                                                        <input
                                                            type="time"
                                                            value={todo.dueTime}
                                                            onChange={(e) => setTodos(todos.map(t =>
                                                                t.id === todo.id ? { ...t, dueTime: e.target.value } : t
                                                            ))}
                                                            className="time-input"
                                                        />
                                                        <span className="todo-date">{todo.date}</span>
                                                        <select
                                                            value={todo.recurring}
                                                            onChange={(e) => setTodos(todos.map(t =>
                                                                t.id === todo.id ? { ...t, recurring: e.target.value } : t
                                                            ))}
                                                            className="recurring-select"
                                                        >
                                                            <option value="">No Repeat</option>
                                                            <option value="daily">Daily</option>
                                                            <option value="weekly">Weekly</option>
                                                            <option value="monthly">Monthly</option>
                                                        </select>
                                                        <button
                                                            onClick={() => deleteTodo(todo.id)}
                                                            className="delete-button"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                    <div className="note-section">
                                                        <input
                                                            type="text"
                                                            value={noteText}
                                                            onChange={(e) => setNoteText(e.target.value)}
                                                            placeholder="Add a note..."
                                                            className="note-input"
                                                        />
                                                        <button onClick={() => addNote(todo.id)} className="note-button">Add Note</button>
                                                        {notes[todo.id] && (
                                                            <div className="note-display">{notes[todo.id]}</div>
                                                        )}
                                                    </div>
                                                    <div className="subtasks-section">
                                                        <div className="progress-bar" style={{ width: `${todo.progress}%` }}></div>
                                                        <input
                                                            type="text"
                                                            placeholder="Add subtask..."
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    addSubtask(todo.id, e.target.value)
                                                                    e.target.value = ''
                                                                }
                                                            }}
                                                            className="subtask-input"
                                                        />
                                                        <div className="subtasks-list">
                                                            {todo.subtasks.map(subtask => (
                                                                <div key={subtask.id} className="subtask-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={subtask.completed}
                                                                        onChange={() => toggleSubtask(todo.id, subtask.id)}
                                                                    />
                                                                    <span className={subtask.completed ? 'completed' : ''}>
                                                                        {subtask.text}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </div>
            </div>
        </DragDropContext>
    )
}

export default App