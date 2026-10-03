import streamlit as st
import pandas as pd
import sqlite3
import requests
import os
import plotly.express as px
import plotly.graph_objects as bg
from datetime import datetime

# ==============================================================================
# Page Configuration & Styling
# ==============================================================================
st.set_page_config(
    page_title="EnergyOps - Installation Workflow Platform",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Dark Enterprise Aesthetics
st.markdown("""
<style>
    .main { background-color: #0b1329; }
    .stApp { background-color: #0b1329; color: #f8fafc; }
    .metric-card {
        background-color: #131f37;
        border: 1px solid #233554;
        padding: 16px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .status-blocked {
        background-color: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: bold;
    }
    .status-inprogress {
        background-color: rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: bold;
    }
    .status-completed {
        background-color: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# Database & Secrets Layer
# ==============================================================================
def get_secrets_config():
    """Retrieve configuration securely from st.secrets if deployed on Streamlit Cloud."""
    api_key = None
    backend_url = "http://localhost:3000/api"
    
    if hasattr(st, "secrets"):
        try:
            api_key = st.secrets.get("ENERGYOPS_API_KEY", None)
            backend_url = st.secrets.get("BACKEND_URL", backend_url)
        except Exception:
            pass
            
    return api_key, backend_url

API_KEY, BACKEND_URL = get_secrets_config()

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "energyops.db")

def get_db_connection():
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    return None

def fetch_jobs_data():
    conn = get_db_connection()
    if conn:
        df = pd.read_sql_query("SELECT * FROM jobs ORDER BY createdAt DESC", conn)
        conn.close()
        return df
    return pd.DataFrame()

def fetch_alerts_data():
    conn = get_db_connection()
    if conn:
        df = pd.read_sql_query("SELECT * FROM alerts ORDER BY createdAt DESC", conn)
        conn.close()
        return df
    return pd.DataFrame()

def fetch_metrics_data():
    conn = get_db_connection()
    if conn:
        df = pd.read_sql_query("SELECT * FROM metrics ORDER BY timestamp DESC", conn)
        conn.close()
        return df
    return pd.DataFrame()

# ==============================================================================
# Sidebar & Header Navigation
# ==============================================================================
st.sidebar.markdown("## ⚡ EnergyOps Platform")
st.sidebar.caption("Enterprise Installation Workflow Engine")

nav_choice = st.sidebar.radio(
    "Navigation View:",
    [
        "📊 Command Center",
        "🗂️ Workflow Pipeline",
        "📋 Jobs Registry",
        "🚨 Operational Incidents",
        "📈 Observability & Metrics",
        "🔐 Streamlit Secrets Guide"
    ]
)

st.sidebar.markdown("---")
user_role = st.sidebar.selectbox("Simulated Role:", ["Admin (Full Override)", "Manager (Approvals)", "Engineer (Progress)"])

# Secrets Status Box in Sidebar
st.sidebar.markdown("---")
st.sidebar.markdown("### 🔐 Streamlit Secrets Status")
if API_KEY:
    st.sidebar.success(f"🔒 **Secrets Loaded**: API Key `{API_KEY[:6]}...` authenticated.")
else:
    st.sidebar.info("💡 Running in local DB mode. To use Streamlit Secrets, add `ENERGYOPS_API_KEY` in Streamlit Cloud Settings.")

# ==============================================================================
# VIEW 1: 📊 Command Center
# ==============================================================================
if nav_choice == "📊 Command Center":
    st.title("📊 EnergyOps Executive Command Center")
    st.caption("Real-time monitoring of energy installation contracts, labor hours, and workflow stages.")

    df_jobs = fetch_jobs_data()

    if not df_jobs.empty:
        # KPI Cards Row
        total_jobs = len(df_jobs)
        active_jobs = len(df_jobs[df_jobs['status'].isin(['In Progress', 'Not Started'])])
        completed_jobs = len(df_jobs[df_jobs['status'] == 'Completed'])
        delayed_jobs = len(df_jobs[df_jobs['status'] == 'Delayed'])
        blocked_jobs = len(df_jobs[df_jobs['status'] == 'Blocked'])
        avg_hours = df_jobs['actualHours'].mean()

        col1, col2, col3, col4, col5 = st.columns(5)
        col1.metric("Active Installations", active_jobs, delta=f"{total_jobs} total")
        col2.metric("Completed Jobs", completed_jobs, delta="100% sign-off")
        col3.metric("Delayed Jobs", delayed_jobs, delta_color="inverse")
        col4.metric("Blocked Jobs (Alerts)", blocked_jobs, delta_color="inverse")
        col5.metric("Avg Labor Hours", f"{avg_hours:.1f} hrs")

        st.markdown("---")

        # Plotly Charts Row
        c_left, c_right = st.columns(2)

        with c_left:
            st.subheader("Workflow Lifecycle Stage Distribution")
            stage_counts = df_jobs['currentStage'].value_counts().reset_index()
            stage_counts.columns = ['Stage', 'Jobs Count']
            fig_stage = px.bar(
                stage_counts, x='Stage', y='Jobs Count',
                color='Stage', text='Jobs Count',
                color_discrete_sequence=px.colors.qualitative.Pastel
            )
            fig_stage.update_layout(template="plotly_dark", height=320, showlegend=False)
            st.plotly_chart(fig_stage, use_container_width=True)

        with c_right:
            st.subheader("Installation Status Breakdown")
            status_counts = df_jobs['status'].value_counts().reset_index()
            status_counts.columns = ['Status', 'Count']
            fig_status = px.pie(
                status_counts, values='Count', names='Status',
                color='Status', hole=0.4,
                color_discrete_map={
                    'In Progress': '#10b981',
                    'Blocked': '#ef4444',
                    'Completed': '#3b82f6',
                    'Delayed': '#f59e0b',
                    'Not Started': '#94a3b8'
                }
            )
            fig_status.update_layout(template="plotly_dark", height=320)
            st.plotly_chart(fig_status, use_container_width=True)

        st.markdown("---")
        st.subheader("Filterable Installation Jobs Overview")
        
        # Filter controls
        f_col1, f_col2, f_col3 = st.columns(3)
        with f_col1:
            sel_status = st.selectbox("Filter Status:", ["All"] + list(df_jobs['status'].unique()))
        with f_col2:
            sel_stage = st.selectbox("Filter Stage:", ["All"] + list(df_jobs['currentStage'].unique()))
        with f_col3:
            search_query = st.text_input("Search Customer / ID / Address:")

        filtered_df = df_jobs.copy()
        if sel_status != "All":
            filtered_df = filtered_df[filtered_df['status'] == sel_status]
        if sel_stage != "All":
            filtered_df = filtered_df[filtered_df['currentStage'] == sel_stage]
        if search_query:
            filtered_df = filtered_df[
                filtered_df['id'].str.contains(search_query, case=False) |
                filtered_df['customerName'].str.contains(search_query, case=False) |
                filtered_df['siteAddress'].str.contains(search_query, case=False)
            ]

        st.dataframe(
            filtered_df[[
                'id', 'customerName', 'productType', 'currentStage',
                'status', 'priority', 'assignedEngineer', 'installationProgress',
                'targetCompletionDate'
            ]],
            use_container_width=True,
            hide_index=True
        )

# ==============================================================================
# VIEW 2: 🗂️ Workflow Pipeline Board
# ==============================================================================
elif nav_choice == "🗂️ Workflow Pipeline":
    st.title("🗂️ Workflow Pipeline Kanban View")
    st.caption("Track stage progression across the 9 energy installation lifecycle phases.")

    df_jobs = fetch_jobs_data()

    if not df_jobs.empty:
        stages_list = [
            'Site Assessment', 'System Design', 'Design Review',
            'Permit Submission', 'Permit Approval', 'Scheduling',
            'Installation', 'Inspection', 'Completion'
        ]

        # Display swimlanes in columns
        cols = st.columns(len(stages_list))

        for idx, stage in enumerate(stages_list):
            with cols[idx]:
                stage_jobs = df_jobs[df_jobs['currentStage'] == stage]
                st.markdown(f"#### {stage}")
                st.caption(f"{len(stage_jobs)} jobs")

                for _, j in stage_jobs.iterrows():
                    with st.container(border=True):
                        st.markdown(f"**{j['id']}** | {j['priority']}")
                        st.markdown(f"*{j['customerName']}*")
                        st.markdown(f"`{j['productType']}`")
                        
                        if j['status'] == 'Blocked':
                            st.error(f"⚠️ {j['blockerReason'] or 'Blocked'}")
                        else:
                            st.markdown(f"Status: **{j['status']}**")
                            
                        st.caption(f"👤 {j['assignedEngineer']}")

        st.markdown("---")
        st.subheader("⚡ Advance Workflow Stage")
        with st.form("advance_stage_form"):
            col_a, col_b, col_c = st.columns(3)
            with col_a:
                selected_job_id = st.selectbox("Select Job:", df_jobs['id'].tolist())
            with col_b:
                new_stage = st.selectbox("Target Workflow Stage:", stages_list)
            with col_c:
                transition_reason = st.text_input("Audit Reason:")
            
            submit_stage = st.form_submit_button("Confirm Stage Change")
            if submit_stage:
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE jobs SET currentStage = ?, updatedAt = ? WHERE id = ?",
                        (new_stage, datetime.now().isoformat(), selected_job_id)
                    )
                    conn.commit()
                    conn.close()
                    st.success(f"Job {selected_job_id} advanced to {new_stage}!")
                    st.rerun()

# ==============================================================================
# VIEW 3: 📋 Jobs Registry & Create Form
# ==============================================================================
elif nav_choice == "📋 Jobs Registry":
    st.title("📋 Installation Jobs Registry")
    st.caption("Master database of energy contracts with creation & attribute editing.")

    df_jobs = fetch_jobs_data()

    st.subheader("➕ Initialize New Installation Contract")
    with st.form("create_job_form"):
        fc1, fc2 = st.columns(2)
        with fc1:
            c_name = st.text_input("Customer Name:", placeholder="e.g. Apex BioTech HQ")
            s_address = st.text_input("Site Address:", placeholder="e.g. 100 Innovation Way, Austin, TX")
            prod_type = st.selectbox("Product Type:", [
                "Commercial Solar", "Residential Battery Storage",
                "Microgrid System", "EV Charging Hub", "Industrial Wind Turbine"
            ])
        with fc2:
            eng_name = st.selectbox("Assigned Lead Engineer:", [
                "Elena Rostova", "Marcus Vance", "Sarah Jenkins", "David Chen", "Aisha Khan"
            ])
            prio = st.selectbox("Priority:", ["Critical", "High", "Medium", "Low"])
            est_hrs = st.number_input("Estimated Labor Hours:", min_value=10, max_value=500, value=120)

        submit_new = st.form_submit_button("Create Installation Contract")
        if submit_new:
            if c_name and s_address:
                new_id = f"JOB-{1000 + len(df_jobs) + 1}"
                now_str = datetime.now().isoformat()
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO jobs (
                            id, customerName, siteAddress, productType, assignedEngineer, assignedManager,
                            currentStage, status, priority, createdAt, updatedAt, targetCompletionDate,
                            blockerReason, permitStatus, installationProgress, estimatedHours, actualHours
                        ) VALUES (?, ?, ?, ?, ?, 'Amanda Torres', 'Site Assessment', 'In Progress', ?, ?, ?, ?, NULL, 'Pending', 0, ?, 0)
                    """, (new_id, c_name, s_address, prod_type, eng_name, prio, now_str, now_str, now_str, est_hrs))
                    conn.commit()
                    conn.close()
                    st.success(f"Job Contract {new_id} created successfully!")
                    st.rerun()

    st.markdown("---")
    st.subheader("Full Database Registry")
    st.dataframe(df_jobs, use_container_width=True)

# ==============================================================================
# VIEW 4: 🚨 Operational Incidents
# ==============================================================================
elif nav_choice == "🚨 Operational Incidents":
    st.title("🚨 Operational Incidents & Alerts")
    st.caption("Active monitoring engine tracking blocked jobs, permit delays, and SLA risks.")

    df_alerts = fetch_alerts_data()

    if not df_alerts.empty:
        col_active = df_alerts[df_alerts['status'] == 'Active']
        col_acked = df_alerts[df_alerts['status'] == 'Acknowledged']

        st.metric("Active Critical Alerts", len(col_active), delta=f"{len(df_alerts)} total alerts")

        st.subheader("Active Incidents Queue")
        for _, alt in col_active.iterrows():
            with st.container(border=True):
                ac1, ac2, ac3 = st.columns([1, 4, 1])
                with ac1:
                    st.error(f"🚨 {alt['severity']}")
                with ac2:
                    st.markdown(f"**Job {alt['jobId']}** - {alt['type']}")
                    st.markdown(alt['message'])
                    st.caption(f"Created: {alt['createdAt']}")
                with ac3:
                    if st.button("Acknowledge", key=f"ack_{alt['id']}"):
                        conn = get_db_connection()
                        if conn:
                            cursor = conn.cursor()
                            cursor.execute(
                                "UPDATE alerts SET status = 'Acknowledged', acknowledgedAt = ?, acknowledgedBy = 'Admin User' WHERE id = ?",
                                (datetime.now().isoformat(), alt['id'])
                            )
                            conn.commit()
                            conn.close()
                            st.success(f"Alert {alt['id']} acknowledged.")
                            st.rerun()

        st.markdown("---")
        st.subheader("Acknowledged Alerts History")
        st.dataframe(col_acked, use_container_width=True)

# ==============================================================================
# VIEW 5: 📈 Observability & Metrics
# ==============================================================================
elif nav_choice == "📈 Observability & Metrics":
    st.title("📈 System Observability & API Telemetry")
    st.caption("Performance telemetry, response latencies, and server throughput stats.")

    df_metrics = fetch_metrics_data()

    if not df_metrics.empty:
        total_reqs = len(df_metrics)
        failed_reqs = len(df_metrics[df_metrics['success'] == 0])
        success_rate = ((total_reqs - failed_reqs) / total_reqs) * 100 if total_reqs > 0 else 100
        avg_latency = df_metrics['latencyMs'].mean()

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Total Requests", total_reqs)
        m2.metric("Success Rate", f"{success_rate:.1f}%")
        m3.metric("Avg Response Time", f"{avg_latency:.1f} ms")
        m4.metric("Version", "v1.4.2-prod")

        st.subheader("Recent HTTP Request Logs")
        st.dataframe(df_metrics.head(20), use_container_width=True)

# ==============================================================================
# VIEW 6: 🔐 Streamlit Secrets Guide
# ==============================================================================
elif nav_choice == "🔐 Streamlit Secrets Guide":
    st.title("🔐 Deployment & Streamlit Secrets Guide")
    st.caption("How to securely configure API keys and environment secrets on Streamlit Community Cloud.")

    st.markdown("""
    ### 1. How Streamlit Secrets Work
    Streamlit Cloud provides a secure key-value store (`st.secrets`) so sensitive values like API keys, database credentials, or secret tokens are **NEVER committed to GitHub**.

    ### 2. Setting Secrets in Streamlit Community Cloud
    When deploying this app on [share.streamlit.io](https://share.streamlit.io):
    1. Click on **App Settings** -> **Secrets**.
    2. Paste your secret configuration in TOML format:

    ```toml
    ENERGYOPS_API_KEY = "eo_live_9843279482934892"
    BACKEND_URL = "https://your-express-backend.render.com/api"
    ENVIRONMENT = "production"
    ADMIN_PASSWORD = "your_secure_password"
    ```

    3. Click **Save**. The app will immediately read these values via `st.secrets["ENERGYOPS_API_KEY"]`!

    ### 3. Local Development (`.streamlit/secrets.toml`)
    To test secrets locally:
    1. Copy `.streamlit/secrets.toml.example` to `.streamlit/secrets.toml`.
    2. `.streamlit/secrets.toml` is already added to `.gitignore` so your secrets stay private.
    """)

    st.subheader("Active Secrets Configuration Status")
    st.json({
        "API_KEY_LOADED": API_KEY is not None,
        "BACKEND_URL": BACKEND_URL,
        "ENVIRONMENT": os.environ.get("NODE_ENV", "development"),
        "PYTHON_VERSION": "3.13.5",
        "DATABASE_FOUND": os.path.exists(DB_PATH)
    })
