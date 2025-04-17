from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default_secret_key")
app.permanent_session_lifetime = timedelta(minutes=30)

# Supabase PostgreSQL connection string
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    "DATABASE_URL",
    'postgresql://postgres.fypkrobpaxajbedzsfrf:Rishi%400211@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Models
class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    fullname = db.Column(db.String(150), nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def get_id(self):
        return str(self.id)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.String(10), nullable=False)
    priority = db.Column(db.String(10), default='medium')
    category = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('tasks', lazy=True))

# Routes
@app.route('/dashboard')
@login_required
def dashboard():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', tasks=tasks)

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for("home"))
        else:
            flash("Invalid email or password", "error")
            return render_template("login.html")
    return render_template("login.html")

@app.route('/signup', methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        fullname = request.form.get("fullname")
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if password != confirm_password:
            flash("Passwords do not match", "error")
            return render_template("signup.html")

        existing_user = User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first()
        if existing_user:
            flash("Username or email already exists", "error")
            return render_template("signup.html")

        hashed_password = generate_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            fullname=fullname,
            password=hashed_password
        )
        try:
            db.session.add(new_user)
            db.session.commit()
            flash("Account created successfully! Please log in.", "success")
            return redirect(url_for("login"))
        except Exception as e:
            db.session.rollback()
            flash(f"Error: {e}", "error")
            return render_template("signup.html")

    return render_template("signup.html")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

@app.route('/home')
@login_required
def home():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return render_template("home_page.html", tasks=tasks)

@app.route('/add_task', methods=["POST"])
@login_required
def add_task():
    text = request.form.get("task_text") or request.form.get("text")
    due_date = request.form.get("due_date")
    priority = request.form.get("priority")
    category = request.form.get("category")

    if text and due_date and category:
        new_task = Task(
            text=text,
            due_date=due_date,
            priority=priority or 'medium',
            category=category,
            user_id=current_user.id
        )
        try:
            db.session.add(new_task)
            db.session.commit()
            flash("Task added successfully!", "success")
        except Exception as e:
            db.session.rollback()
            flash(f"Failed to add task: {e}", "error")
    else:
        flash("Missing required fields", "error")

    return redirect(url_for("home"))

@app.route('/toggle_complete/<int:task_id>')
@login_required
def toggle_complete(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        flash("Unauthorized action", "error")
        return redirect(url_for("home"))
    task.completed = not task.completed
    db.session.commit()
    flash("Task status updated!", "success")
    return redirect(url_for("dashboard"))

@app.route('/delete_task/<int:task_id>')
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        flash("Unauthorized action", "error")
        return redirect(url_for("home"))
    db.session.delete(task)
    db.session.commit()
    flash("Task deleted!", "success")
    return redirect(url_for("dashboard"))

# Run the app
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
