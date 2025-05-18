# Metro Network 🚇

A full-stack application to simulate and visualize metro routes using Google Maps API, powered by a Flask backend and a Next.js frontend.

---

## 🛠 Installation & Setup

Follow the steps below to run the project locally.

### 1. Prerequisites

- [Python 3.11+](https://www.python.org/)
- [Node.js](https://nodejs.org/)
- [uv (Python dependency manager)](https://github.com/astral-sh/uv)
- A Google Maps API key

---

### 2. Clone the Repository

```bash
git clone https://github.com/shahnawazkhan11/metroNetwork
cd metroNetwork
```

---

### 3. Frontend Setup (Next.js)



Create .env.local file and add <br>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key" <br>
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/v1 <br>
```bash
cd frontend
npm install 
npm run dev 
```
---

### 4. Backend Setup (Flask)

Create .env file and add <br>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key" <br>
NEXT_PUBLIC_MAP_ID="your_map_id" <br>


```bash
cd backend
source .venv/Scripts/Activate
uv sync
flask run
```
