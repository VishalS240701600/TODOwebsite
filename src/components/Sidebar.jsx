import React from 'react';

const Sidebar = ({
    darkMode,
    categories,
    category,
    setCategory,
    todos,
    setTodos
}) => {
    const priorities = ['high', 'medium', 'low'];
    const dateFilters = ['all', 'today', 'week', 'month'];

    const filterByPriority = (priority) => {
        setCategory(`priority-${priority}`);
    };

    const filterByDate = (filter) => {
        setCategory(`date-${filter}`);
    };

    const getTaskStats = () => {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        return { total, completed, pending };
    };

    const stats = getTaskStats();

    return (
        <div className={`sidebar ${darkMode ? 'dark-mode' : ''}`}>
            <div className="sidebar-section">
                <h3>Overview</h3>
                <div className="stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Tasks</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{stats.completed}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pending</span>
                        <span className="stat-value">{stats.pending}</span>
                    </div>
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Categories</h3>
                <div className="category-list">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`category-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat === 'all' ? 'All Tasks' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Priority</h3>
                <div className="priority-list">
                    {priorities.map((priority) => (
                        <button
                            key={priority}
                            className={`priority-btn ${category === `priority-${priority}` ? 'active' : ''}`}
                            onClick={() => filterByPriority(priority)}
                        >
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Time Frame</h3>
                <div className="date-filter-list">
                    {dateFilters.map((filter) => (
                        <button
                            key={filter}
                            className={`date-filter-btn ${category === `date-${filter}` ? 'active' : ''}`}
                            onClick={() => filterByDate(filter)}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;