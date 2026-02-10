const { useState, useEffect } = React;

// ==================== UTILITY FUNCTIONS ====================

const getAuthToken = () => localStorage.getItem('authToken');

const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

const setAuthData = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
};

const apiCall = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    if (!response.ok && response.status === 401) {
        clearAuthData();
        window.location.hash = '#login';
    }
    
    return response;
};

// ==================== USER MENU COMPONENT ====================

function UserMenu() {
    const [user, setUser] = useState(getUser());

    useEffect(() => {
        const interval = setInterval(() => {
            setUser(getUser());
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        clearAuthData();
        setUser(null);
        window.location.hash = '#home';
        window.location.reload();
    };

    if (!user) {
        return null;
    }

    return (
        <div className="user-menu-container">
            <div className="user-info">
                👤 {user.username}
                {user.role === 'admin' && <span className="admin-badge">Admin</span>}
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
    );
}

// ==================== NEWS BULLETIN COMPONENT (NEW PROFESSIONAL DESIGN) ====================

function NewsBulletin() {
    const [news, setNews] = useState([]);
    const [selectedNews, setSelectedNews] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            setNews(data);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching news:', err);
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    const truncateText = (text, maxLength = 80) => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    return (
        <>
            <div className="news-bulletin-container">
                <div className="news-bulletin-header">
                    <div className="header-icon">📰</div>
                    <h3>Latest News & Updates</h3>
                    <div className="news-indicator">
                        <span className="live-dot"></span>
                        <span>Live</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="news-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading updates...</p>
                    </div>
                ) : news.length === 0 ? (
                    <div className="no-news">
                        <p>No updates available at the moment</p>
                    </div>
                ) : (
                    <div className="news-scroll-container">
                        <div className="news-items">
                            {news.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    className="news-item"
                                    onClick={() => setSelectedNews(item)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="news-date">
                                        <span className="date-day">{new Date(item.date).getDate()}</span>
                                        <span className="date-month">
                                            {new Date(item.date).toLocaleDateString('en-IN', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="news-content">
                                        <h4>{item.title}</h4>
                                        <p>{truncateText(item.content)}</p>
                                        <span className="read-more">Read more →</span>
                                    </div>
                                    <div className="news-badge">New</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="news-footer">
                    <span>Updated: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
            </div>

            {/* News Detail Modal */}
            {selectedNews && (
                <div className="news-modal" onClick={() => setSelectedNews(null)}>
                    <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedNews(null)}>×</button>
                        <div className="modal-header">
                            <h2>{selectedNews.title}</h2>
                            <span className="modal-date">{formatDate(selectedNews.date)}</span>
                        </div>
                        <div className="modal-body">
                            <p>{selectedNews.content}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ==================== IMAGE SLIDER COMPONENT ====================

function ImageSlider() {
    const images = [
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
        'https://images.unsplash.com/photo-1562774053-701939374585?w=1200',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200',
        'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1200'
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="image-slider">
            {images.map((img, index) => (
                <img 
                    key={index}
                    src={img} 
                    alt={`Campus ${index + 1}`}
                    className={`slider-image ${index === currentIndex ? 'active' : ''}`}
                />
            ))}
            <div className="slider-controls">
                {images.map((_, index) => (
                    <div 
                        key={index}
                        className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}

// ==================== LOGIN PAGE ====================

function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setAuthData(data.token, data.user);
                setSuccess('Login successful!');
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.hash = '#admin';
                    } else {
                        window.location.hash = '#home';
                    }
                    window.location.reload();
                }, 1000);
            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-content fade-in">
            <div className="login-container">
                <div className="login-box">
                    <div className="login-header">
                        <div className="login-icon">🔐</div>
                        <h2>Admin Login</h2>
                        <p>Sign in to manage website content</p>
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message show">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="login-info">
                        <p>🔒 Secure admin access only</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== ADMIN DASHBOARD ====================

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('news');
    const user = getUser();

    if (!user || user.role !== 'admin') {
        window.location.hash = '#home';
        return null;
    }

    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Admin Dashboard</h1>
            
            <div className="admin-tabs">
                <button 
                    className={`admin-tab ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    📰 News Management
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'admissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('admissions')}
                >
                    📝 Admissions
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'contacts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contacts')}
                >
                    💬 Contact Messages
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'news' && <NewsManagement />}
                {activeTab === 'admissions' && <AdmissionsManagement />}
                {activeTab === 'contacts' && <ContactsManagement />}
            </div>
        </div>
    );
}

// ==================== NEWS MANAGEMENT (ENHANCED) ====================

function NewsManagement() {
    const [news, setNews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await apiCall('/api/admin/news');
            const data = await response.json();
            setNews(data);
        } catch (err) {
            console.error('Error fetching news:', err);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const url = editingNews 
                ? `/api/admin/news/${editingNews.id}` 
                : '/api/admin/news';
            const method = editingNews ? 'PUT' : 'POST';

            const response = await apiCall(url, {
                method,
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert(editingNews ? 'News updated successfully!' : 'News added successfully!');
                fetchNews();
                resetForm();
            } else {
                alert(data.error || 'Error saving news');
            }
        } catch (err) {
            alert('Error saving news. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (newsItem) => {
        setEditingNews(newsItem);
        setFormData({
            title: newsItem.title,
            content: newsItem.content,
            date: newsItem.date.split('T')[0],
            is_active: newsItem.is_active
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this news item? This action cannot be undone.')) return;

        try {
            const response = await apiCall(`/api/admin/news/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (response.ok) {
                alert('News deleted successfully!');
                fetchNews();
            } else {
                alert(data.error || 'Error deleting news');
            }
        } catch (err) {
            alert('Error deleting news. Please try again.');
        }
    };

    const toggleStatus = async (newsItem) => {
        try {
            const response = await apiCall(`/api/admin/news/${newsItem.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...newsItem,
                    is_active: !newsItem.is_active,
                    date: newsItem.date.split('T')[0]
                })
            });

            if (response.ok) {
                fetchNews();
            }
        } catch (err) {
            alert('Error updating status');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            date: new Date().toISOString().split('T')[0],
            is_active: true
        });
        setEditingNews(null);
        setShowForm(false);
    };

    return (
        <div className="news-management">
            <div className="management-header">
                <div>
                    <h2>📰 News & Updates Management</h2>
                    <p className="subtitle">Manage news that appears on the homepage bulletin</p>
                </div>
                <button 
                    className="cta-button"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Add New Update'}
                </button>
            </div>

            {showForm && (
                <div className="card mt-3 news-form-card">
                    <h3>{editingNews ? '✏️ Edit News Update' : '➕ Add New Update'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter news headline (e.g., Annual Sports Day 2026)"
                                maxLength="200"
                            />
                            <small>{formData.title.length}/200 characters</small>
                        </div>

                        <div className="form-group">
                            <label>Content *</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows="5"
                                required
                                placeholder="Enter detailed news content..."
                                maxLength="1000"
                            ></textarea>
                            <small>{formData.content.length}/1000 characters</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                    />
                                    <span>
                                        <strong>Show on Website</strong>
                                        <br/>
                                        <small>Uncheck to hide from public</small>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-button" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingNews ? '💾 Update News' : '✓ Publish News')}
                            </button>
                            <button type="button" className="cancel-button" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="news-stats">
                <div className="stat-card">
                    <span className="stat-number">{news.length}</span>
                    <span className="stat-label">Total News</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{news.filter(n => n.is_active).length}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{news.filter(n => !n.is_active).length}</span>
                    <span className="stat-label">Inactive</span>
                </div>
            </div>

            <div className="news-list mt-3">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th width="5%">#</th>
                            <th width="40%">Title</th>
                            <th width="15%">Date</th>
                            <th width="10%">Status</th>
                            <th width="30%">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {news.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    <div className="empty-state">
                                        <p>📭 No news updates yet</p>
                                        <button className="cta-button" onClick={() => setShowForm(true)}>
                                            Add Your First Update
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            news.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <strong>{item.title}</strong>
                                        <br/>
                                        <small className="news-preview">{item.content.substring(0, 60)}...</small>
                                    </td>
                                    <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <button 
                                            className={`status-toggle ${item.is_active ? 'active' : 'inactive'}`}
                                            onClick={() => toggleStatus(item)}
                                            title="Click to toggle status"
                                        >
                                            {item.is_active ? '✓ Active' : '✕ Inactive'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="edit-btn"
                                                onClick={() => handleEdit(item)}
                                                title="Edit this news"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDelete(item.id)}
                                                title="Delete this news"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== ADMISSIONS MANAGEMENT ====================

function AdmissionsManagement() {
    const [admissions, setAdmissions] = useState([]);

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const fetchAdmissions = async () => {
        try {
            const response = await apiCall('/api/admin/admissions');
            const data = await response.json();
            setAdmissions(data);
        } catch (err) {
            console.error('Error fetching admissions:', err);
        }
    };

    return (
        <div className="admissions-management">
            <h2>📝 Admission Applications</h2>
            <p className="subtitle">{admissions.length} application(s) received</p>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Class</th>
                            <th>Submitted On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admissions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">No applications yet</td>
                            </tr>
                        ) : (
                            admissions.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.full_name}</strong></td>
                                    <td>{item.email}</td>
                                    <td>{item.phone}</td>
                                    <td><span className="class-badge">{item.class}</span></td>
                                    <td>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== CONTACTS MANAGEMENT ====================

function ContactsManagement() {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await apiCall('/api/admin/contacts');
            const data = await response.json();
            setContacts(data);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        }
    };

    return (
        <div className="contacts-management">
            <h2>💬 Contact Messages</h2>
            <p className="subtitle">{contacts.length} message(s) received</p>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Received On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">No messages yet</td>
                            </tr>
                        ) : (
                            contacts.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.email}</td>
                                    <td>{item.subject}</td>
                                    <td className="message-cell" title={item.message}>{item.message}</td>
                                    <td>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== HOME PAGE (WITH NEWS BULLETIN) ====================

function HomePage() {
    return (
        <div className="fade-in">
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to Sainik Defense College</h1>
                    <p>Building Tomorrow's Defenders Today</p>
                    <p>NDA • CDS • AFCAT • Army • Navy • Air Force Preparation</p>
                    <button className="cta-button" onClick={() => window.location.hash = '#admission'}>
                        Apply for Admission
                    </button>
                </div>
            </div>

            {/* Main Content with News Bulletin */}
            <div className="home-content-wrapper">
                <div className="main-content">
                    <ImageSlider />

                    <div className="cards-grid">
                        <div className="card">
                            <div className="card-icon">🎓</div>
                            <h3>Academic Excellence</h3>
                            <p>CBSE curriculum integrated with defense preparation. Expert faculty with proven track record in NDA/CDS coaching.</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">🏋️</div>
                            <h3>Physical Training</h3>
                            <p>State-of-the-art gymnasium, swimming pool, and training ground. Daily PT sessions and sports activities.</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">🎖️</div>
                            <h3>Discipline & Character</h3>
                            <p>Instilling military discipline, leadership qualities, and strong moral values in every student.</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">📚</div>
                            <h3>Modern Library</h3>
                            <p>Extensive collection of defense studies books, periodicals, and digital resources for comprehensive learning.</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">💻</div>
                            <h3>Smart Classrooms</h3>
                            <p>Technology-enabled learning with interactive boards, projectors, and online resources.</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">🏆</div>
                            <h3>100+ NDA Selections</h3>
                            <p>Proud record of 100+ successful selections in NDA, CDS, and other defense examinations.</p>
                        </div>
                    </div>
                </div>

                {/* News Bulletin Sidebar */}
                <aside className="news-sidebar">
                    <NewsBulletin />
                </aside>
            </div>
        </div>
    );
}

// ==================== OTHER PAGES (ABBREVIATED - Same as before) ====================

function AboutPage() {
    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">About Sainik Defense College</h1>
            
            <div className="card">
                <h3>Our Vision</h3>
                <p>To be the premier institution in Rajasthan for nurturing young minds aspiring to serve the nation through armed forces, creating future leaders with unwavering dedication, discipline, and patriotic fervor.</p>
            </div>

            <div className="card mt-3">
                <h3>Our Mission</h3>
                <p>We are committed to providing holistic education that combines academic excellence with rigorous defense training. Our mission is to develop physically fit, mentally alert, and morally upright citizens ready to defend our great nation.</p>
            </div>

            <div className="cards-grid mt-3">
                <div className="card">
                    <h3>Why Choose Us?</h3>
                    <ul style={{textAlign: 'left', lineHeight: '2'}}>
                        <li>✓ Expert Defense Faculty</li>
                        <li>✓ Proven Success Rate</li>
                        <li>✓ Modern Infrastructure</li>
                        <li>✓ Comprehensive Training</li>
                        <li>✓ Character Development</li>
                        <li>✓ Individual Attention</li>
                    </ul>
                </div>
                <div className="card">
                    <h3>Our Achievements</h3>
                    <ul style={{textAlign: 'left', lineHeight: '2'}}>
                        <li>🏆 100+ NDA Selections</li>
                        <li>🏆 50+ CDS Qualifiers</li>
                        <li>🏆 State Champions in Sports</li>
                        <li>🏆 Best Defense College Award 2025</li>
                        <li>🏆 100% Board Results</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function DirectorsDeskPage() {
    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Director's Desk</h1>
            
            <div className="directors-desk">
                <div>
                    <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" 
                        alt="Director" 
                        className="director-image"
                    />
                    <p className="director-name text-center mt-2">
                        [Director Name]<br/>
                        Director<br/>
                        Sainik Defense College
                    </p>
                </div>
                <div className="director-message">
                    <h2>Message from the Director</h2>
                    <p>Dear Students, Parents, and Well-wishers,</p>
                    
                    <p>It gives me immense pride and pleasure to welcome you to Sainik Defense College, Hingonia, Jaipur. Our institution stands as a beacon of excellence in defense education, dedicated to shaping the future warriors of our great nation.</p>
                    
                    <p>At Sainik Defense College, we don't just prepare students for examinations; we mold their character, strengthen their resolve, and instill in them the values of discipline, dedication, and patriotism.</p>
                    
                    <p><strong>Jai Hind!</strong></p>
                </div>
            </div>
        </div>
    );
}

function AcademicsPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Academic Programs</h1></div>; }
function AdmissionPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Admission Form</h1></div>; }
function FacilitiesPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Our Facilities</h1></div>; }
function GalleryPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Gallery</h1></div>; }
function ResultsPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Results & Achievements</h1></div>; }
function ContactPage() { return <div className="page-content fade-in"><h1 className="text-center mb-3">Contact Us</h1></div>; }

// ==================== MAIN APP COMPONENT ====================

function App() {
    const [currentPage, setCurrentPage] = useState('home');

    useEffect(() => {
        const handleNavClick = (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                setCurrentPage(page);
                
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                e.target.classList.add('active');

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        document.addEventListener('click', handleNavClick);
        return () => document.removeEventListener('click', handleNavClick);
    }, []);

    const renderPage = () => {
        switch(currentPage) {
            case 'home': return <HomePage />;
            case 'about': return <AboutPage />;
            case 'directors-desk': return <DirectorsDeskPage />;
            case 'academics': return <AcademicsPage />;
            case 'admission': return <AdmissionPage />;
            case 'facilities': return <FacilitiesPage />;
            case 'gallery': return <GalleryPage />;
            case 'results': return <ResultsPage />;
            case 'contact': return <ContactPage />;
            case 'login': return <LoginPage />;
            case 'admin': return <AdminDashboard />;
            default: return <HomePage />;
        }
    };

    return renderPage();
}

// ==================== RENDER COMPONENTS ====================

ReactDOM.render(<UserMenu />, document.getElementById('user-menu'));
ReactDOM.render(<App />, document.getElementById('app-root'));
