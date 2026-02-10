const { useState, useEffect } = React;

// ==================== UTILITY FUNCTIONS ====================

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Get user from localStorage
const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Set auth data
const setAuthData = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Clear auth data
const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
};

// API call with auth
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

// ==================== NEWS TICKER COMPONENT ====================

function NewsTicker() {
    const [news, setNews] = useState([]);

    useEffect(() => {
        fetch('/api/news')
            .then(res => res.json())
            .then(data => setNews(data))
            .catch(err => console.error('Error fetching news:', err));
    }, []);

    return (
        <div className="ticker-content">
            {news.map((item, index) => (
                <span key={index} className="ticker-item">
                    {item.title} - {new Date(item.date).toLocaleDateString('en-IN')}
                </span>
            ))}
            {news.length === 0 && <span className="ticker-item">Loading latest updates...</span>}
        </div>
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
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
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
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin 
                ? { username: formData.username, password: formData.password }
                : formData;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                if (isLogin) {
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
                    setSuccess('Registration successful! Please login.');
                    setIsLogin(true);
                    setFormData({ username: '', email: '', password: '' });
                }
            } else {
                setError(data.error || 'An error occurred');
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
                    <h2>{isLogin ? 'Login' : 'Register'}</h2>
                    
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message show">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Enter username"
                            />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter email"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter password"
                            />
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                        </button>
                    </form>

                    <div className="login-toggle">
                        {isLogin ? (
                            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Register here</a></p>
                        ) : (
                            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Login here</a></p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== CHANGE PASSWORD PAGE ====================

function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return null;
    }

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
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiCall('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Password changed successfully!');
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setError(data.error || 'Failed to change password');
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
                    <h2>Change Password</h2>
                    
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message show">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Current Password *</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password *</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
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
                <button 
                    className={`admin-tab ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    🔒 Change Password
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'news' && <NewsManagement />}
                {activeTab === 'admissions' && <AdmissionsManagement />}
                {activeTab === 'contacts' && <ContactsManagement />}
                {activeTab === 'password' && <ChangePasswordPage />}
            </div>
        </div>
    );
}

// ==================== NEWS MANAGEMENT ====================

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
                alert(data.message);
                fetchNews();
                resetForm();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error saving news');
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
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this news item?')) return;

        try {
            const response = await apiCall(`/api/admin/news/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fetchNews();
            }
        } catch (err) {
            alert('Error deleting news');
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
                <h2>News & Updates</h2>
                <button 
                    className="cta-button"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : '+ Add News'}
                </button>
            </div>

            {showForm && (
                <div className="card mt-3">
                    <h3>{editingNews ? 'Edit News' : 'Add New News'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="News title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Content *</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows="4"
                                required
                                placeholder="News content"
                            ></textarea>
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
                                    Active (Show on website)
                                </label>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-button">
                                {editingNews ? 'Update News' : 'Add News'}
                            </button>
                            <button type="button" className="cancel-button" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="news-list mt-3">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {news.map((item) => (
                            <tr key={item.id}>
                                <td>{item.title}</td>
                                <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                                <td>
                                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                                        {item.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="edit-btn"
                                        onClick={() => handleEdit(item)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
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
            <h2>Admission Applications</h2>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Class</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admissions.map((item) => (
                            <tr key={item.id}>
                                <td>{item.full_name}</td>
                                <td>{item.email}</td>
                                <td>{item.phone}</td>
                                <td>{item.class}</td>
                                <td>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                        ))}
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
            <h2>Contact Messages</h2>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((item) => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.email}</td>
                                <td>{item.subject}</td>
                                <td className="message-cell">{item.message}</td>
                                <td>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== EXISTING PAGES (Continued from original) ====================

// Home Page Component
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
    );
}

// About Us Page
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

// Director's Desk Page
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
                    
                    <p>At Sainik Defense College, we don't just prepare students for examinations; we mold their character, strengthen their resolve, and instill in them the values of discipline, dedication, and patriotism. Our comprehensive approach combines rigorous academic training with intensive physical conditioning and mental fortitude development.</p>
                    
                    <p>We take pride in our state-of-the-art infrastructure, experienced faculty members who are themselves veterans or defense experts, and our proven track record of success. With over 100 successful NDA selections and countless achievements in various defense examinations, we continue to set benchmarks in defense education.</p>
                    
                    <p>Our students learn not just from textbooks, but from real-life experiences, field training, and interactions with serving officers. We believe in nurturing all-round personality development - making our students physically fit, mentally alert, and morally strong.</p>
                    
                    <p>To the aspiring defense personnel, I say: Choose Sainik Defense College, and embark on a transformative journey that will prepare you not just for an examination, but for a lifetime of service to the nation. Your dreams of wearing the uniform and serving India start here.</p>
                    
                    <p>Together, let us march towards excellence and glory!</p>
                    
                    <p><strong>Jai Hind!</strong></p>
                </div>
            </div>
        </div>
    );
}

// Academics Page
function AcademicsPage() {
    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Academic Programs</h1>
            
            <div className="cards-grid">
                <div className="card">
                    <h3>🎓 Classes 6th to 12th</h3>
                    <p>CBSE curriculum with integrated defense preparation from the foundation level itself. Building strong academic base while nurturing military aptitude.</p>
                </div>
                
                <div className="card">
                    <h3>📖 NDA Foundation Course</h3>
                    <p>Specially designed curriculum for students from class 8th onwards, preparing them systematically for NDA entrance examination.</p>
                </div>
                
                <div className="card">
                    <h3>🎯 CDS Preparation</h3>
                    <p>Comprehensive coaching for Combined Defense Services examination with focus on written test and SSB interview preparation.</p>
                </div>

                <div className="card">
                    <h3>✈️ AFCAT Training</h3>
                    <p>Air Force Common Admission Test preparation with specialized modules for technical and non-technical streams.</p>
                </div>

                <div className="card">
                    <h3>🏋️ Physical Fitness Program</h3>
                    <p>Daily PT sessions, yoga, sports, swimming, and obstacle training to meet defense forces physical standards.</p>
                </div>

                <div className="card">
                    <h3>🧠 Personality Development</h3>
                    <p>Communication skills, leadership training, group discussions, and mock SSB interviews for complete personality enhancement.</p>
                </div>
            </div>

            <div className="card mt-3">
                <h3>Subject Offerings</h3>
                <div className="cards-grid">
                    <div>
                        <h4>Science Stream</h4>
                        <ul style={{lineHeight: '2'}}>
                            <li>Physics</li>
                            <li>Chemistry</li>
                            <li>Mathematics</li>
                            <li>Computer Science</li>
                            <li>English</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Commerce Stream</h4>
                        <ul style={{lineHeight: '2'}}>
                            <li>Accountancy</li>
                            <li>Business Studies</li>
                            <li>Economics</li>
                            <li>Mathematics</li>
                            <li>English</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Admission Page
function AdmissionPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        class: '',
        father_name: '',
        mother_name: '',
        address: '',
        previous_school: '',
        hobbies: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setPhotoFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            if (photoFile) {
                formDataToSend.append('photo', photoFile);
            }

            const response = await fetch('/api/admission', {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();
            
            if (result.success) {
                setShowSuccess(true);
                setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    dob: '',
                    gender: '',
                    class: '',
                    father_name: '',
                    mother_name: '',
                    address: '',
                    previous_school: '',
                    hobbies: ''
                });
                setPhotoFile(null);
                setTimeout(() => setShowSuccess(false), 5000);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Admission Form</h1>
            
            <div className="admission-form">
                <h2>Apply for Admission</h2>
                <p className="text-center">Fill in the details below to apply for admission to Sainik Defense College</p>

                {showSuccess && (
                    <div className="success-message show">
                        ✅ Application submitted successfully! We will contact you soon.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input 
                            type="text" 
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required 
                            placeholder="Enter student's full name"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email *</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required 
                                placeholder="Email address"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone *</label>
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required 
                                placeholder="Contact number"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth *</label>
                            <input 
                                type="date" 
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender *</label>
                            <select 
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Class Applying For *</label>
                        <select 
                            name="class"
                            value={formData.class}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Class</option>
                            <option value="6th">6th Standard</option>
                            <option value="7th">7th Standard</option>
                            <option value="8th">8th Standard</option>
                            <option value="9th">9th Standard</option>
                            <option value="10th">10th Standard</option>
                            <option value="11th">11th Standard</option>
                            <option value="12th">12th Standard</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Father's Name *</label>
                            <input 
                                type="text" 
                                name="father_name"
                                value={formData.father_name}
                                onChange={handleChange}
                                required 
                                placeholder="Father's full name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Mother's Name *</label>
                            <input 
                                type="text" 
                                name="mother_name"
                                value={formData.mother_name}
                                onChange={handleChange}
                                required 
                                placeholder="Mother's full name"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address *</label>
                        <textarea 
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3" 
                            required
                            placeholder="Complete residential address"
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Previous School</label>
                        <input 
                            type="text" 
                            name="previous_school"
                            value={formData.previous_school}
                            onChange={handleChange}
                            placeholder="Name of previous school (if any)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Hobbies & Interests</label>
                        <textarea 
                            name="hobbies"
                            value={formData.hobbies}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Student's hobbies and interests"
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Upload Photo</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <button type="submit" className="submit-button" disabled={isSubmitting}>
                        {isSubmitting ? <span className="loading"></span> : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Facilities Page
function FacilitiesPage() {
    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Our Facilities</h1>
            
            <div className="cards-grid">
                <div className="card">
                    <div className="card-icon">🏫</div>
                    <h3>Smart Classrooms</h3>
                    <p>Air-conditioned classrooms equipped with digital boards, projectors, and audio-visual aids for effective learning.</p>
                </div>

                <div className="card">
                    <div className="card-icon">📚</div>
                    <h3>Well-Stocked Library</h3>
                    <p>Extensive collection of 10,000+ books, magazines, journals, and digital resources on defense studies and academics.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🔬</div>
                    <h3>Science Laboratories</h3>
                    <p>Fully equipped Physics, Chemistry, and Biology labs with modern equipment for practical experiments.</p>
                </div>

                <div className="card">
                    <div className="card-icon">💻</div>
                    <h3>Computer Lab</h3>
                    <p>Latest computers with high-speed internet, educational software, and coding platforms.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🏋️</div>
                    <h3>Gymnasium</h3>
                    <p>Modern gym with cardio equipment, weight training machines, and professional trainers.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🏊</div>
                    <h3>Swimming Pool</h3>
                    <p>Olympic-size swimming pool with trained lifeguards and swimming coaches.</p>
                </div>

                <div className="card">
                    <div className="card-icon">⚽</div>
                    <h3>Sports Ground</h3>
                    <p>Multi-purpose sports ground for football, cricket, hockey, volleyball, and athletics.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🎯</div>
                    <h3>Shooting Range</h3>
                    <p>Indoor shooting range for air rifle practice under expert guidance.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🏃</div>
                    <h3>Obstacle Course</h3>
                    <p>Military-style obstacle training course for physical endurance and mental toughness.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🏨</div>
                    <h3>Hostel Facilities</h3>
                    <p>Comfortable hostel accommodation with mess, recreation room, and 24/7 security.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🍽️</div>
                    <h3>Dining Hall</h3>
                    <p>Hygienic mess providing nutritious meals prepared by experienced cooks.</p>
                </div>

                <div className="card">
                    <div className="card-icon">🚑</div>
                    <h3>Medical Facility</h3>
                    <p>In-house medical room with qualified doctor and nurse for immediate healthcare.</p>
                </div>
            </div>
        </div>
    );
}

// Gallery Page
function GalleryPage() {
    const galleryImages = [
        { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', title: 'Campus Building' },
        { url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800', title: 'Smart Classroom' },
        { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800', title: 'Science Lab' },
        { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', title: 'Sports Activities' },
        { url: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=800', title: 'Students in Uniform' },
        { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', title: 'Library' },
        { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', title: 'Computer Lab' },
        { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800', title: 'Physical Training' },
        { url: 'https://images.unsplash.com/photo-1581726690015-c9861afc8a43?w=800', title: 'Basketball Court' },
    ];

    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Gallery</h1>
            
            <div className="gallery-grid">
                {galleryImages.map((img, index) => (
                    <div key={index} className="gallery-item">
                        <img src={img.url} alt={img.title} />
                        <div className="gallery-overlay">
                            <p>{img.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Results Page
function ResultsPage() {
    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Results & Achievements</h1>
            
            <div className="card">
                <h2 className="text-center">🏆 Our Success Story</h2>
                <p className="text-center" style={{fontSize: '18px', marginTop: '20px'}}>
                    Sainik Defense College takes immense pride in the achievements of our students who have successfully qualified for various defense services.
                </p>
            </div>

            <div className="cards-grid mt-3">
                <div className="card">
                    <h3>NDA Selections</h3>
                    <div className="achievement-number">100+</div>
                    <p>Students selected for National Defense Academy since establishment</p>
                </div>

                <div className="card">
                    <h3>CDS Qualifiers</h3>
                    <div className="achievement-number">50+</div>
                    <p>Students qualified in Combined Defense Services Examination</p>
                </div>

                <div className="card">
                    <h3>AFCAT Success</h3>
                    <div className="achievement-number">30+</div>
                    <p>Students selected through Air Force Common Admission Test</p>
                </div>

                <div className="card">
                    <h3>Board Results</h3>
                    <div className="achievement-number">100%</div>
                    <p>Pass percentage in CBSE Board Examinations</p>
                </div>
            </div>

            <div className="card mt-3">
                <h3>Recent Toppers (2025-26)</h3>
                <table className="results-table" style={{width: '100%', marginTop: '20px'}}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Examination</th>
                            <th>Achievement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Rahul Sharma</td>
                            <td>NDA</td>
                            <td>Selected - Air Force</td>
                        </tr>
                        <tr>
                            <td>Priya Singh</td>
                            <td>NDA</td>
                            <td>Selected - Army</td>
                        </tr>
                        <tr>
                            <td>Amit Kumar</td>
                            <td>CDS</td>
                            <td>Selected - Navy</td>
                        </tr>
                        <tr>
                            <td>Neha Verma</td>
                            <td>AFCAT</td>
                            <td>Selected - Flying Branch</td>
                        </tr>
                        <tr>
                            <td>Vikram Rathore</td>
                            <td>Class 12th</td>
                            <td>95.2% CBSE</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Contact Page
function ContactPage() {
    const [contactData, setContactData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setContactData({
            ...contactData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            const result = await response.json();
            
            if (result.success) {
                setShowSuccess(true);
                setContactData({ name: '', email: '', subject: '', message: '' });
                setTimeout(() => setShowSuccess(false), 5000);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error sending message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-content fade-in">
            <h1 className="text-center mb-3">Contact Us</h1>
            
            <div className="contact-container">
                <div className="contact-info">
                    <h3>Get In Touch</h3>
                    
                    <div className="info-item">
                        <div className="info-icon">📍</div>
                        <div>
                            <h4>Address</h4>
                            <p>Sainik Defense College<br/>
                            Hingonia, Jaipur<br/>
                            Rajasthan - 302012</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">📞</div>
                        <div>
                            <h4>Phone</h4>
                            <p>+91 9928889381<br/>
                            +91 141-XXXX-XXX (Office)</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">✉️</div>
                        <div>
                            <h4>Email</h4>
                            <p>info@sainikdefensecollege.edu.in<br/>
                            admission@sainikdefensecollege.edu.in</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">⏰</div>
                        <div>
                            <h4>Office Hours</h4>
                            <p>Monday - Saturday<br/>
                            9:00 AM - 5:00 PM</p>
                        </div>
                    </div>
                </div>

                <div className="admission-form">
                    <h3>Send us a Message</h3>
                    
                    {showSuccess && (
                        <div className="success-message show">
                            ✅ Message sent successfully! We'll get back to you soon.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Your Name *</label>
                            <input 
                                type="text" 
                                name="name"
                                value={contactData.name}
                                onChange={handleChange}
                                placeholder="Enter your name" 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input 
                                type="email" 
                                name="email"
                                value={contactData.email}
                                onChange={handleChange}
                                placeholder="Enter your email" 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Subject *</label>
                            <input 
                                type="text" 
                                name="subject"
                                value={contactData.subject}
                                onChange={handleChange}
                                placeholder="Subject of your inquiry" 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Message *</label>
                            <textarea 
                                name="message"
                                value={contactData.message}
                                onChange={handleChange}
                                rows="5" 
                                placeholder="Your message"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? <span className="loading"></span> : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ==================== MAIN APP COMPONENT ====================

function App() {
    const [currentPage, setCurrentPage] = useState('home');

    useEffect(() => {
        // Handle navigation
        const handleNavClick = (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                setCurrentPage(page);
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                e.target.classList.add('active');

                // Scroll to top
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

ReactDOM.render(<NewsTicker />, document.getElementById('news-ticker'));
ReactDOM.render(<UserMenu />, document.getElementById('user-menu'));
ReactDOM.render(<App />, document.getElementById('app-root'));