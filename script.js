// AgriNova Pro Frontend Logic - Mission Critical Farming Intelligence
const API_BASE_URL = "http://127.0.0.1:8007";

let currentWeatherData = { temp: 25, humidity: 80, rain: 0 };
let userCoords = { lat: null, lon: null };

// High-Precision Geo-Location Initialization
function initGeoLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userCoords.lat = position.coords.latitude;
                userCoords.lon = position.coords.longitude;
                console.log(`[GPS] Localized to: ${userCoords.lat}, ${userCoords.lon}`);
                fetchWeather(); // Refresh with real location
            },
            (error) => {
                console.warn("[GPS] Access denied, using default Mumbai nexus.");
                fetchWeather(); // Fallback
            }
        );
    } else {
        fetchWeather();
    }
}

// Quick Demo Autofill Logic for Demo Judges
function autofill(cropType) {
    const scenarios = {
        'banana': { n: 100, p: 80, k: 200, ph: 6.0, temp: 28, hum: 85, rain: 150 },
        'chickpea': { n: 40, p: 65, k: 80, ph: 6.8, temp: 22, hum: 20, rain: 70 }
    };

    const data = scenarios[cropType];
    if (!data) return;

    console.log(`[Demo] Loading Scenario: ${cropType}`);

    // Set Soil Values
    document.getElementById('n_val').value = data.n;
    document.getElementById('p_val').value = data.p;
    document.getElementById('k_val').value = data.k;
    document.getElementById('ph_val').value = data.ph;

    // Set Simulation Overrides
    document.getElementById('temp_sim').value = data.temp;
    document.getElementById('hum_sim').value = data.hum;
    document.getElementById('rain_sim').value = data.rain;

    Swal.fire({
        toast: true,
        position: 'top-end',
        title: `Scenario: ${cropType.toUpperCase()}`,
        text: 'Inputs optimized for prediction.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false,
        background: '#161b22',
        color: '#fff',
        iconColor: '#84cc16'
    });

    // Auto-run prediction for better UX
    setTimeout(recommendCrop, 100);
}

async function recommendCrop() {
    const n = document.getElementById('n_val').value;
    const p = document.getElementById('p_val').value;
    const k = document.getElementById('k_val').value;
    const ph = document.getElementById('ph_val').value;
    const btn = document.getElementById('pipeline-run-btn');
    const resultBox = document.getElementById('result-box');

    // UI Feedback: Start Pipeline
    btn.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i> Initializing Pipeline...';
    btn.disabled = true;
    resultBox.classList.remove('active');
    
    // Simulations
    const tempSim = document.getElementById('temp_sim').value;
    const humSim = document.getElementById('hum_sim').value;
    const rainSim = document.getElementById('rain_sim').value;

    const bodyData = {
        N: parseFloat(n),
        P: parseFloat(p),
        K: parseFloat(k),
        ph: parseFloat(ph),
        q: "Mumbai",
        lat: userCoords.lat,
        lon: userCoords.lon
    };

    if (tempSim) bodyData.temp_sim = parseFloat(tempSim);
    if (humSim) bodyData.hum_sim = parseFloat(humSim);
    if (rainSim) bodyData.rain_sim = parseFloat(rainSim);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) throw new Error("Inference engine offline");

        const data = await response.json();
        
        // Update UI with AI results
        const resultBox = document.getElementById('result-box');
        if (resultBox) resultBox.classList.add('active');
        resultBox.style.display = 'block'; // Failsafe
        
        const cropResultEl = document.getElementById('crop-result');
        if(cropResultEl) cropResultEl.innerText = data.crop;
        
        const cropDescEl = document.getElementById('crop-desc');
        if (cropDescEl) {
            cropDescEl.innerText = `AgriNova AI has identified ${data.crop} as the optimal biomass for your current soil chemistry and environmental moisture levels.`;
        }
        
        // Expert Model Visual Feedback
        const badgeEl = document.querySelector('.badge-mini');
        if (data.source.includes("Expert")) {
            badgeEl.innerHTML = `<i class="fa-solid fa-star"></i> Expert System Verified`;
            badgeEl.style.background = "rgba(191, 255, 0, 0.2)";
            badgeEl.style.color = "var(--neon-green)";
            cropResultEl.style.color = "var(--neon-green)";
        } else {
            badgeEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> AI Analysis Complete`;
            badgeEl.style.background = "rgba(132, 204, 22, 0.1)";
            badgeEl.style.color = "var(--accent-green)";
            cropResultEl.style.color = "var(--accent-green)";
        }

        // Update Main Confidence Circle
        const probEntries = Object.entries(data.probabilities);
        const [winningCrop, winningProb] = probEntries[0];
        const confidenceEl = document.getElementById('current-confidence');
        if (confidenceEl) confidenceEl.innerText = winningProb;
        
        // Confidence Circle Animation (Optional Glow)
        const circle = document.querySelector('.confidence-circle');
        if (circle) {
            circle.style.borderColor = "var(--accent-green)";
            circle.style.boxShadow = `0 0 30px rgba(132, 204, 22, ${parseFloat(winningProb)/100})`;
        }

        // Render Remaining Confidence Breakdown (Price Trend Style)
        const probContainer = document.getElementById('prob-container');
        if (probContainer) {
            probContainer.innerHTML = '';
            probEntries.forEach(([crop, prob]) => {
                const item = document.createElement('div');
                item.className = 'market-row';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.padding = '10px 15px';
                item.style.background = 'rgba(13, 17, 23, 0.5)';
                item.style.borderRadius = '10px';
                item.style.marginBottom = '8px';
                
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px">
                        <i class="fa-solid fa-seedling" style="color:var(--accent-green)"></i>
                        <span style="font-size:0.9rem">${crop}</span>
                    </div>
                    <div style="text-align:right">
                        <span style="display:block; font-size:0.8rem; font-weight:700; color:var(--accent-green)">${prob}</span>
                        <span style="font-size:0.6rem; color:var(--text-secondary)">MATCH SCORE</span>
                    </div>
                `;
                probContainer.appendChild(item);
            });
        }

        // Update Market Intelligence (Agent 2)
        if (data.market_intelligence) {
            const mi = data.market_intelligence;
            const priceEl = document.getElementById('market-price');
            if(priceEl) priceEl.innerText = `₹ ${mi.current_price_inr} / qtl`;
            
            const trendEl = document.getElementById('market-trend');
            if(trendEl) {
                trendEl.innerText = mi.trend;
                trendEl.style.color = mi.trend.includes("Bullish") ? "var(--neon-green)" : "#3b82f6";
            }
            
            const profitEl = document.getElementById('profit-index');
            if(profitEl) profitEl.innerText = mi.profit_index;
        }

        if (data.market_pick) {
            const pick = data.market_pick;
            const langSelect = document.getElementById('lang-select-dash') || document.getElementById('lang-select');
            const lang = langSelect ? langSelect.value : 'en';
            const t = translations[lang] || translations['en'];
            
            // Add a recommendation text
            const marketCard = document.querySelector('.market-card') || document.getElementById('prob-container');
            if (marketCard) {
                let recEl = document.getElementById('market-rec-text');
                if (!recEl) {
                    recEl = document.createElement('p');
                    recEl.id = 'market-rec-text';
                    recEl.style.marginTop = '15px';
                    recEl.style.fontSize = '0.85rem';
                    recEl.style.borderTop = '1px solid rgba(255,255,255,0.05)';
                    recEl.style.paddingTop = '10px';
                    marketCard.appendChild(recEl);
                }
                
                recEl.innerHTML = `<i class="fa-solid fa-star" style="color: gold"></i> <strong>${t['mi-pick']}:</strong> ${pick.crop} ${t['mi-at']} ₹ ${pick.price}`;
                
                // If the market pick is different from the primary result, highlight it
                if (pick.crop.toLowerCase() !== data.crop.toLowerCase()) {
                    recEl.style.background = 'rgba(255, 215, 0, 0.1)';
                    recEl.style.padding = '10px';
                    recEl.style.borderRadius = '8px';
                    recEl.style.border = '1px dashed gold';
                }
            }
        }

        // Update Chain of Thought (CoT) Orchestration
        if (data.coT_analysis) {
            const cot = data.coT_analysis;
            document.getElementById('master-plan-text').innerText = cot.master_strategy;
            
            const stepsList = document.getElementById('cot-steps-list');
            stepsList.innerHTML = ''; // Clear old steps
            cot.chain_of_thought.forEach((step, index) => {
                const stepEl = document.createElement('div');
                stepEl.className = 'cot-step';
                stepEl.innerHTML = `<i class="fa-solid fa-chevron-right"></i> ${step}`;
                stepsList.appendChild(stepEl);
            });
        }

        // Update Compliance Shield
        if (data.compliance_shield) {
            const cs = data.compliance_shield;
            const indicator = document.getElementById('compliance-indicator');
            const note = document.getElementById('policy-note');
            const alertsBox = document.getElementById('compliance-alerts');
            
            if(indicator) {
                indicator.innerText = cs.gov_indicator;
                indicator.className = `compliance-status ${cs.status.toLowerCase() == 'approved' ? 'safe' : 'warning'}`;
            }
            if(note) {
                note.innerText = cs.policy_note;
            }
            
            if(alertsBox) {
                alertsBox.innerHTML = '';
                if (cs.alerts && cs.alerts.length > 0) {
                    cs.alerts.forEach(alert => {
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'compliance-alert-item';
                        alertDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${alert}`;
                        alertsBox.appendChild(alertDiv);
                    });
                }
            }
        }

        resultBox.classList.add('active');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Beautiful Success Toast Notification from SweetAlert2
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Prediction Successful!',
            text: `Best crop: ${data.crop}`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#161b22',
            color: '#fff',
            iconColor: '#84cc16'
        });

    } catch (error) {
        console.error("Pipeline failure:", error);
        btn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Sync Error';
        
        Swal.fire({
            icon: 'error',
            title: 'Pipeline Error',
            text: 'Could not reach the AI Inference Engine. Please ensure the backend is running.',
            background: '#161b22',
            color: '#fff',
            confirmButtonColor: '#84cc16'
        });

        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run AI Analysis';
            btn.disabled = false;
        }, 3000);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run AI Analysis';
        btn.disabled = false;
    }
}

// --- FEATURE MODAL LOGIC ---
const featureDetails = {
    "Real-Time Monitoring": "Hamara system IoT sensors aur satellite telemetry ka ek powerful combination use karta hai. Ye mitti ki Volumetric Water Content (VWC) aur Electrical Conductivity ko monitor karta hai. Isse kisan ko ye pata chalta hai ki mitti mein nutrients kitne active hain. Research ke mutabik, real-time data use karne se fertilizer ka kharcha 20% tak kam ho jata hai.",
    "Predictive Intelligence": "Ye feature sirf mitti nahi, balki Historical Weather Patterns aur Atmospheric Pressure ko bhi analyze karta hai. Hum 'Ensemble Learning' (Random Forest + Gradient Boosting) use karte hain jo ye batata hai ki agle 15 dino mein pest (keede) lagne ka kitna risk hai. Isse kisan 'Reactive' hone ki jagah 'Proactive' bante hain.",
    "Resource Optimization": "Iska main maqsad hai 'More Crop Per Drop'. Hum Evapotranspiration (ET) rates calculate karte hain—yani ki mitti aur poudhon se kitna pani uda (evaporate hua). Is data se system automatic irrigation cycles suggest karta hai, jo water wastage ko 30-40% tak reduce kar deta hai.",
    "Climate Adaptation": "Global warming ki wajah se mausam unpredictable ho gaya hai. Ye tool Climate Models (like CMIP6) ka data lekar ye analyze karta hai ki kya aapki chuni hui crop aane wale extreme heat ya unseasonal rain ko jhel payegi? Agar risk zyada hai, toh ye alternative 'Short-duration' crops ya 'Cover crops' suggest karta hai."
};

function initModal() {
    const modal = document.getElementById('featureModal');
    const closeBtn = document.querySelector('.close-btn');

    document.querySelectorAll('.explore-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            const title = this.parentElement.querySelector('h3').innerText;
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDescription').innerText = featureDetails[title] || "Details loading...";
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Prevent scroll
        };
    });

    closeBtn.onclick = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };
}

// Autofill redundant function removed (merged into lines 28-60)

// Global Environment Synchronization
async function fetchWeather() {
    try {
        let url = `${API_BASE_URL}/weather?q=Mumbai`;
        if (userCoords.lat && userCoords.lon) {
            url += `&lat=${userCoords.lat}&lon=${userCoords.lon}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Satellite sync error");
        const data = await response.json();
        
        document.getElementById('temp-val').innerText = `${Math.round(data.temperature)}°C`;
        document.getElementById('weather-desc').innerText = data.description;
        document.getElementById('hum-val').innerText = `${data.humidity}%`;
        document.getElementById('rain-val').innerText = `${data.rainfall}mm`;
        document.getElementById('alert-val').innerText = `${data.location} | GPS Satellite Sync`;

    } catch (error) {
        document.getElementById('alert-val').innerText = "Running in Local Cache Mode";
    }
}

async function fetchTips() {
    try {
        const response = await fetch(`${API_BASE_URL}/tips`);
        if (!response.ok) throw new Error("Ecosystem link error");
        const data = await response.json();
        
        const tipsContainer = document.getElementById('tips-container');
        tipsContainer.innerHTML = data.map((tip, i) => `
            <div class="tip-item" style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                <h3 style="font-size: 1rem; color: #fff; margin-bottom: 5px;">${tip.title}</h3>
                <p style="font-size: 0.85rem; color: #94a3b8;">${tip.description}</p>
            </div>
        `).join('');
    } catch (e) {}
}

// High-Fidelity Localization
// High-Fidelity Localization System
const translations = {
    'en': {
        'nav-home': 'Home', 'nav-about': 'About', 'nav-services': 'Services', 'nav-dashboard': 'AI Dashboard',
        'hero-title': 'Revolutionize Your Farming with AgriNova',
        'hero-desc': 'Empowering farmers with AI-driven insights for optimal crop yield, real-time weather updates, and sustainable agricultural practices.',
        'services-title': 'Cutting-Edge Technologies',
        'services-desc': 'Leverage our suite of advanced tools designed to maximize your agricultural output.',
        'dash-title': 'Live AI Dashboard',
        'dash-subtitle': 'Test the AgriNova ML Pipeline right now.',
        'form-title': 'Soil Analysis Input',
        'env-sim': 'Environment Simulation',
        'btn-predict': 'Run AI Analysis',
        'result-header': 'AI Analysis Complete',
        'rec-crop': 'RECOMMENDED CROP',
        'confidence': 'Model Confidence',
        'prob-title': 'Full Probability Breakdown',
        'weather-title': 'Live Satellite Feed',
        'tip-title': 'Smart Tip',
        'voice-btn': 'Voice Assistant (Listen)',
        'scan-demo': 'Scan for Live Demo',
        'scan-desc': 'Open AgriNova instantly on your phone.',
        'mi-title': 'Agent 2: Market Intelligence',
        'mi-price': 'Mandi Bhav',
        'mi-trend': 'Price Trend',
        'mi-roi': 'ROI Potential',
        'mi-pick': 'Profit Recommendation',
        'mi-at': 'at',
        'cot-title': 'AI Master Strategist: Chain of Thought',
        'cot-loading': 'Orchestrating scientific, financial, and policy data...'
    },
    'hi': {
        'nav-home': 'होम', 'nav-about': 'के बारे में', 'nav-services': 'सेवाएं', 'nav-dashboard': 'एआई डैशबोर्ड',
        'hero-title': 'एग्रीनोवा के साथ अपनी खेती में क्रांति लाएं',
        'hero-desc': 'इष्टतम फसल उपज, वास्तविक समय के मौसम और टिकाऊ कृषि पद्धतियों के लिए एआई-संचालित अंतर्दृष्टि के साथ किसानों को सशक्त बनाना।',
        'services-title': 'अत्याधुनिक प्रौद्योगिकियां',
        'services-desc': 'कृषि उत्पादन को अधिकतम करने के लिए डिज़ाइन किए गए हमारे उन्नत टूल का लाभ उठाएं।',
        'dash-title': 'लाइव एआई डैशबोर्ड',
        'dash-subtitle': 'अभी एग्रीनोवा मशीन लर्निंग पाइपलाइन का परीक्षण करें।',
        'form-title': 'मिट्टी विश्लेषण इनपुट',
        'env-sim': 'पर्यावरण सिमुलेशन',
        'btn-predict': 'Run AI Analysis',
        'result-header': 'एआई विश्लेषण पूरा हुआ',
        'rec-crop': 'अनुशंसित फसल',
        'confidence': 'मॉडल का विश्वास',
        'prob-title': 'पूर्ण संभावना ब्रेकडाउन',
        'weather-title': 'लाइव सैटेलाइट फीड',
        'tip-title': 'स्मार्ट टिप',
        'voice-btn': 'आवाज सहायक (सुनें)',
        'scan-demo': 'लाइव डेमो के लिए स्कैन करें',
        'scan-desc': 'अपने फोन पर तुरंत एग्रीनोवा खोलें।',
        'mi-title': 'एजेंट 2: मार्केट इंटेलिजेंस',
        'mi-price': 'मंडी भाव',
        'mi-trend': 'मूल्य रुझान',
        'mi-roi': 'लाभ की संभावना',
        'mi-pick': 'सबसे अधिक मुनाफे वाली फसल',
        'mi-at': 'पर',
        'cot-title': 'एआई मास्टर स्ट्रैटेजिस्ट: विचारधारा की श्रृंखला',
        'cot-loading': 'वैज्ञानिक, वित्तीय और नीतिगत डेटा का समन्वय...'
    },
    'mr': {
        'nav-home': 'होम', 'nav-about': 'बद्दल', 'nav-services': 'सेवा', 'nav-dashboard': 'AI डॅशबोर्ड',
        'hero-title': 'अ‍ॅग्रीनोवासह तुमच्या शेतीत क्रांती घडवा',
        'hero-desc': 'पीक उत्पादन, हवामान आणि शाश्वत कृषी पद्धतींसाठी एआय-आधारित अंतर्दृष्टीसह शेतकऱ्यांना सक्षम करणे.',
        'services-title': 'अत्याधुनिक तंत्रज्ञान',
        'services-desc': 'तुमचे कृषी उत्पादन वाढवण्यासाठी डिझाइन केलेल्या आमच्या प्रगत साधनांचा लाभ घ्या.',
        'dash-title': 'लाइव एआई डॅशबोर्ड',
        'dash-subtitle': 'ॲग्रीनोवा मशीन लर्निंग पाइपलाइनची आत्ताच चाचणी करा.',
        'form-title': 'माती विश्लेषण इनपुट',
        'env-sim': 'पर्यावरण सिम्युलेशन',
        'btn-predict': 'Run AI Analysis',
        'result-header': 'AI विश्लेषण पूर्ण झाले',
        'rec-crop': 'शिफारस केलेले पीक',
        'confidence': 'मॉडेलचा विश्वास',
        'prob-title': 'पूर्ण संभाव्यता ब्रेकडाउन',
        'weather-title': 'थेट उपग्रह फीड',
        'tip-title': 'स्मार्ट टिप',
        'voice-btn': 'व्हॉइस असिस्टंट (ऐका)',
        'scan-demo': 'थेट डेमोसाठी स्कॅन करा',
        'scan-desc': 'तुमच्या फोनवर लगेच ॲग्रीनोवा उघडा.',
        'mi-title': 'एजंट 2: मार्केट इंटेलिजेंस',
        'mi-price': 'मंडी भाव',
        'mi-trend': 'किंमत कल',
        'mi-roi': 'नफ्याची क्षमता',
        'mi-pick': 'सर्वाधिक फायदेशीर पीक',
        'mi-at': 'वर',
        'cot-title': 'AI मास्टर स्ट्रॅटेजिस्ट: विचारांची शृंखला',
        'cot-loading': 'वैज्ञानिक, आर्थिक आणि धोरणात्मक डेटाचे समन्वय...'
    }
};

function switchLang(lang) {
    const t = translations[lang];
    
    // Header & Hero
    document.getElementById('hero-title').innerText = t['hero-title'];
    document.getElementById('hero-desc').innerText = t['hero-desc'];
    
    // Navigation
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks[0].innerText = t['nav-home'];
    navLinks[1].innerText = t['nav-about'];
    navLinks[2].innerText = t['nav-services'];
    navLinks[3].innerText = t['nav-dashboard'];

    // Services
    document.getElementById('services-title').innerText = t['services-title'];
    document.getElementById('services-desc').innerText = t['services-desc'];

    // Dashboard (Pro logic)
    const dashProSection = document.querySelector('.dashboard-pro');
    if (dashProSection) {
        const titleEl = dashProSection.querySelector('.sidebar-top span');
        if (titleEl) titleEl.innerText = "AgriNova Pro";
    }
    
    const soilTitle = document.querySelector('.soil-card .card-header h3');
    if (soilTitle) soilTitle.innerHTML = `<i class="fa-solid fa-flask-vial"></i> ${t['form-title']}`;
    
    const weatherTitle = document.querySelector('.weather-hero-card .card-header h3');
    if (weatherTitle) weatherTitle.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${t['weather-title']}`;
    
    const predictBtn = document.getElementById('pipeline-run-btn');
    if (predictBtn) predictBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> ${t['btn-predict']}`;

    // Weather Sidebar
    document.querySelector('.weather-card .card-title').innerHTML = `<i class="fa-solid fa-satellite"></i> ${t['weather-title']}`;
    document.querySelector('.tips-mini h4').innerHTML = `<i class="fa-solid fa-lightbulb" style="color:#84cc16;"></i> ${t['tip-title']}`;

    // Results Card
    const resHeader = document.querySelector('.prediction-card .card-header h3');
    if (resHeader) resHeader.innerHTML = `<i class="fa-solid fa-microchip"></i> ${t['result-header']}`;
    
    const voiceBtn = document.querySelector('.prediction-card .btn-outline');
    if (voiceBtn) voiceBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> ${t['voice-btn']}`;
    
    // Market Intelligence (Agent 2)
    const miBadge = document.querySelector('.market-badge');
    if (miBadge) miBadge.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${t['mi-title']}`;
    
    const miLabels = document.querySelectorAll('.mandi-label');
    if (miLabels.length >= 3) {
        miLabels[0].innerText = t['mi-price'];
        miLabels[1].innerText = t['mi-trend'];
        miLabels[2].innerText = t['mi-roi'];
    }

    // CoT Orchestration
    const cotTitle = document.querySelector('.reasoning-header');
    if (cotTitle) cotTitle.innerHTML = `<i class="fa-solid fa-brain"></i> ${t['cot-title']}`;
    
    const cotLoading = document.getElementById('master-plan-text');
    if (cotLoading && cotLoading.innerText.includes('Orchestrating')) {
        cotLoading.innerText = t['cot-loading'];
    }

    // QR Code
    document.querySelector('.qr-code-container h4').innerText = t['scan-demo'];
    document.querySelector('.qr-code-container p').innerText = t['scan-desc'];
}


// =============================================
// IoT LIVE SENSOR DASHBOARD
// Polls /api/sensor/latest every 5 seconds
// and animates the SVG arc gauges in #iot-panel
// =============================================

let latestSensorData = null; // Cached for autofill

/**
 * Animate a circular SVG gauge arc.
 * @param {string} arcId   - The id of the <circle> gauge-fill element
 * @param {number} value   - Current sensor value
 * @param {number} min     - Minimum possible value
 * @param {number} max     - Maximum possible value
 */
function updateGauge(arcId, value, min, max) {
    const arc = document.getElementById(arcId);
    if (!arc) return;
    const circumference = 2 * Math.PI * 52; // r=52, matches SVG
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const filled = pct * circumference;
    arc.style.transition = 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    arc.setAttribute('stroke-dasharray', `${filled} ${circumference - filled}`);
}

/**
 * Fetch latest sensor reading from the backend and update all gauges + status.
 */
async function fetchSensorData() {
    const statusDot  = document.getElementById('iot-dot');
    const statusText = document.getElementById('iot-status-text');
    const deviceIdEl = document.getElementById('iot-device-id');
    const lastSeenEl = document.getElementById('iot-last-seen');

    try {
        const res = await fetch(`${API_BASE_URL}/api/sensor/latest`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.status === 'waiting' || !json.data) {
            // No hardware connected yet
            if (statusDot)  { statusDot.className  = 'iot-dot disconnected'; }
            if (statusText) { statusText.innerText = 'Waiting for ESP32...'; }
            return;
        }

        const d = json.data;
        latestSensorData = d; // Cache for autofill

        // --- Status indicator ---
        if (statusDot)  { statusDot.className  = 'iot-dot connected'; }
        if (statusText) { statusText.innerText = 'Live'; }

        // --- Device info ---
        if (deviceIdEl) deviceIdEl.innerText = d.device_id || '--';
        if (lastSeenEl && d.timestamp) {
            const t = new Date(d.timestamp);
            lastSeenEl.innerText = t.toLocaleTimeString();
        }

        // --- Temperature (range 0–50 °C) ---
        if (d.temperature != null) {
            const el = document.getElementById('iot-temp-val');
            if (el) el.innerText = d.temperature.toFixed(1);
            updateGauge('gauge-arc-temp', d.temperature, 0, 50);
        }

        // --- Soil Moisture % ---
        const moisture = d.soil_moisture_pct ?? (d.soil_moisture != null
            ? Math.round(Math.max(0, Math.min(100, (1023 - d.soil_moisture) / 1023 * 100)))
            : null);
        if (moisture != null) {
            const el = document.getElementById('iot-moisture-val');
            if (el) el.innerText = moisture.toFixed(1);
            updateGauge('gauge-arc-moisture', moisture, 0, 100);
        }

        // --- Humidity (range 0–100 %) ---
        if (d.humidity != null) {
            const el = document.getElementById('iot-hum-val');
            if (el) el.innerText = d.humidity.toFixed(1);
            updateGauge('gauge-arc-humidity', d.humidity, 0, 100);
        }

        // --- Light (range 0–100 %) ---
        if (d.light != null) {
            const el = document.getElementById('iot-light-val');
            if (el) el.innerText = Math.round(d.light);
            updateGauge('gauge-arc-light', d.light, 0, 100);
        }

        // --- Optional: flash the IOT card border briefly ---
        const panel = document.getElementById('iot-panel');
        if (panel) {
            panel.style.transition = 'box-shadow 0.3s';
            panel.style.boxShadow  = '0 0 20px rgba(132, 204, 22, 0.4)';
            setTimeout(() => { panel.style.boxShadow = ''; }, 800);
        }

    } catch (err) {
        console.warn('[IoT] Could not reach /api/sensor/latest:', err.message);
        if (statusDot)  { statusDot.className  = 'iot-dot disconnected'; }
        if (statusText) { statusText.innerText = 'Backend Offline'; }
    }
}

/**
 * Push the latest ESP32 reading into the Soil Analytics form inputs.
 * Called by "Push to Soil Form" button in the IoT panel.
 */
function autofillFromSensor() {
    if (!latestSensorData) {
        Swal.fire({
            toast: true, position: 'top-end', icon: 'warning',
            title: 'No sensor data yet',
            text: 'Connect your ESP32 and wait for the first reading.',
            showConfirmButton: false, timer: 3000,
            background: '#161b22', color: '#fff'
        });
        return;
    }

    const d = latestSensorData;

    // Fill simulation overrides — temperature & humidity from real sensor
    if (d.temperature != null) {
        const el = document.getElementById('temp_sim');
        if (el) el.value = d.temperature.toFixed(1);
    }
    if (d.humidity != null) {
        const el = document.getElementById('hum_sim');
        if (el) el.value = d.humidity.toFixed(1);
    }
    if (d.rain != null) {
        const el = document.getElementById('rain_sim');
        // Convert 0-100 rain level to rough mm estimate (0-200mm range)
        if (el) el.value = Math.round(d.rain * 2);
    }

    // Highlight the soil form card
    const soilCard = document.querySelector('.soil-card');
    if (soilCard) {
        soilCard.style.transition = 'all 0.3s';
        soilCard.style.border     = '2px solid var(--accent-green)';
        soilCard.style.boxShadow  = '0 0 20px rgba(132, 204, 22, 0.3)';
        setTimeout(() => {
            soilCard.style.border    = '';
            soilCard.style.boxShadow = '';
        }, 1800);
    }

    Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Sensor Data Imported!',
        text: `Temp: ${d.temperature?.toFixed(1)}°C · Humidity: ${d.humidity?.toFixed(1)}% · Device: ${d.device_id}`,
        showConfirmButton: false, timer: 3500, timerProgressBar: true,
        background: '#161b22', color: '#fff', iconColor: '#84cc16'
    });
}

// =============================================

document.addEventListener('DOMContentLoaded', () => {
    initGeoLocation();
    fetchTips();
    initModal();
    // initBackgroundAnim(); // Disabling dynamic background for static consistency
    setInterval(fetchWeather, 300000); // Sync every 5 mins

    // IoT Sensor Live Polling (every 5 seconds)
    fetchSensorData();                        // Immediate first fetch
    setInterval(fetchSensorData, 5000);       // Then every 5s

    // Header Morph Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Reveal animations on scroll
    const reveal = () => {
        const sections = document.querySelectorAll('section');
        sections.forEach(s => {
            const top = s.getBoundingClientRect().top;
            if (top < window.innerHeight - 150) {
                s.style.opacity = '1';
                s.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial reveal states
    document.querySelectorAll('section').forEach(s => {
        s.style.opacity = '0';
        s.style.transform = 'translateY(30px)';
        s.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
    });
    
    window.addEventListener('scroll', reveal);
    reveal();
});

// --- SIDEBAR INTERACTION LOGIC ---
function activateNav(element, section) {
    // 1. Manage Active State Class
    document.querySelectorAll('#sidebar-menu .nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    // 2. Perform Action Based on Section View
    switch(section) {
        case 'dashboard':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'crops':
            autofill('banana');
            Swal.fire({
                icon: 'info',
                title: 'Crop Preset Loaded',
                text: 'Preset conditions for "Banana" loaded. Click "Run AI Analysis" to evaluate viability!',
                toast: true, position: 'top-end', showConfirmButton: false, timer: 4000
            });
            break;
        case 'soil':
            const soilEl = document.getElementById('n_val');
            if (soilEl) {
                soilEl.focus();
                const card = soilEl.closest('.soil-card');
                if(card) {
                    card.style.transition = 'all 0.3s';
                    card.style.border = '2px solid var(--accent-green)';
                    card.style.boxShadow = '0 0 20px rgba(132, 204, 22, 0.3)';
                    setTimeout(() => { card.style.border = ''; card.style.boxShadow = ''; }, 1500);
                }
            }
            break;
        case 'weather':
            const locInput = document.getElementById('location_input');
            if (locInput) {
                locInput.focus();
                const wCard = locInput.closest('.weather-controls');
                if(wCard) {
                    wCard.style.transition = 'all 0.3s';
                    wCard.style.background = 'rgba(132, 204, 22, 0.1)';
                    setTimeout(() => wCard.style.background = '', 1500);
                }
            }
            break;
        case 'market':
            const probContainer = document.getElementById('prob-container');
            if (probContainer && probContainer.innerHTML.trim() !== '') {
                const marketCard = document.querySelector('.market-card');
                marketCard.scrollIntoView({behavior: 'smooth', block: 'center'});
                marketCard.style.transition = 'all 0.3s';
                marketCard.style.border = '2px solid var(--accent-green)';
                setTimeout(() => marketCard.style.border = '', 1500);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Market Data',
                    text: 'Please Run AI Analysis first to unlock predictive market trends for your soil.',
                    confirmButtonColor: '#84cc16'
                });
            }
            break;
        case 'alerts':
            Swal.fire({
                icon: 'success',
                title: 'All Systems Nominal',
                text: 'No critical alerts for your farm today. Weather parameters are within safe thresholds.',
                confirmButtonColor: '#84cc16'
            });
            break;
    }
}
// --- NEW FEATURE: BACKGROUND ANIMATION (Cyber-Space Network) ---
function initBackgroundAnim() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    const particleCount = 60;
    const colors = ['#84cc16', '#3b82f6', '#10b981', '#6366f1'];

    class Particle {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 2 + 1;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.orbit = Math.random() * 300 + 50;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = (Math.random() * 0.001) + 0.0005;
        }

        update() {
            // Orbital motion relative to center
            this.angle += this.speed;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Combination of linear and orbital for a complex network look
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        }
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function drawOrbits() {
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.lineWidth = 1;
        
        [150, 300, 450, 600].forEach(radius => {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        ctx.shadowBlur = 0;
        drawOrbits();

        particles.forEach(p => {
            p.update();
            p.draw();
            
            // Draw connections
            particles.forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(132, 204, 22, ${0.1 * (1 - dist/120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    animate();
}

// Voice Assistant (TTS) Logic
function speakResult() {
    const cropName = document.getElementById('crop-result') ? document.getElementById('crop-result').innerText : '';
    if (!cropName || cropName === '--') {
        alert("Pehle AI Prediction run karein.");
        return;
    }

    const langSelect = document.getElementById('lang-select-dash') || document.getElementById('lang-select');
    const currentLang = langSelect ? langSelect.value : 'en';

    let textToSpeak = `AgriNova AI has identified ${cropName} as the optimal crop for your current soil and environmental conditions.`;
    let speechLang = "en-IN";

    if (currentLang === 'hi') {
        textToSpeak = `एग्रीनोवा एआई के अनुसार, आपकी मिट्टी और मौसम के लिए ${cropName} की खेती सबसे अच्छी रहेगी।`;
        speechLang = "hi-IN";
    } else if (currentLang === 'mr') {
        textToSpeak = `ॲग्रीनोवा एआय नुसार, सध्याच्या हवामान आणि मातीसाठी आपण ${cropName} ची लागवड करावी.`;
        speechLang = "mr-IN"; 
    }

    try {
        window.speechSynthesis.cancel(); // Stop playing

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = speechLang;
        utterance.rate = 1.0; 
        
        const btn = document.getElementById('voice-btn');
        let originalText = "";
        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i> Speaking...';
            
            utterance.onend = () => { btn.innerHTML = originalText; };
            utterance.onerror = (e) => { 
                btn.innerHTML = originalText; 
                console.error("Speech Error:", e);
            };
        }

        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.error("TTS System Error:", err);
        alert("Aapka browser Voice Output ko support nahi kar raha hai.");
    }
}

// --- NEW FEATURE: AGENT 3 (AI FARMING EXPERT) CHAT ---
function toggleChat() {
    const chat = document.getElementById('chat-widget');
    chat.classList.toggle('active');
    if(chat.classList.contains('active')) {
        document.getElementById('user-msg').focus();
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

let chatHistory = [];

// Safe markdown parser wrapper - handles all versions of marked library
function safeParse(text) {
    if (!text) return '';
    try {
        if (typeof marked !== 'undefined') {
            // marked v5+ uses marked.parse()
            if (typeof marked.parse === 'function') return marked.parse(text);
            // older marked versions use marked() directly
            if (typeof marked === 'function') return marked(text);
        }
    } catch (e) {
        console.warn('[Chat] Markdown parse failed, using plain text:', e);
    }
    // Fallback: escape HTML and convert newlines to <br>
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br>');
}

async function sendChatMessage() {
    const input = document.getElementById('user-msg');
    const msg = input.value.trim();
    if (!msg) return;

    // Add user message to UI
    appendChatMsg(msg, 'user-message');
    input.value = '';

    // Typing indication
    const messagesContainer = document.getElementById('chat-messages');
    const typingMsg = document.createElement('div');
    typingMsg.id = 'typing-indicator';
    typingMsg.className = 'message ai-message';
    typingMsg.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Agent 3 is thinking...';
    messagesContainer.appendChild(typingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const cropResEl = document.getElementById('crop-result');
        const cropRes = cropResEl ? cropResEl.innerText : "";
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, crop_context: cropRes, history: chatHistory })
        });
        
        const data = await response.json();
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();

        const replyText = data.response || 'Agent could not generate a response.';
        appendChatMsg(replyText, 'ai-message', true);
        
        // Add to history so AI remembers the conversation flow
        chatHistory.push({ role: "user", content: msg });
        chatHistory.push({ role: "assistant", content: replyText });
        
        // Keep history manageable
        if (chatHistory.length > 10) chatHistory = chatHistory.slice(chatHistory.length - 10);
        
    } catch (e) {
        console.error('[Chat] Error:', e);
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        appendChatMsg("Maaf kijiye, main connect nahi kar paa raha hoon. Backend check karein.", 'ai-message');
    }
}

function appendChatMsg(text, className, isStreaming = false) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    
    // Ensure text is always a string
    const safeText = (text && typeof text === 'string') ? text : String(text || '');
    
    // Add text container for markdown injection
    const textSpan = document.createElement('div');
    textSpan.className = 'msg-content';
    msgDiv.appendChild(textSpan);
    
    // Auto-attach TTS Voice Button just for AI Agent Messages
    if (className === 'ai-message') {
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        btn.className = 'chat-voice-btn';
        btn.title = 'Speak Message Aloud';
        btn.onclick = () => speakChatMsg(safeText, btn);
        msgDiv.appendChild(btn);
    }
    
    messagesContainer.appendChild(msgDiv);
    
    // ChatGPT Style Streaming and Markdown Effect
    if (isStreaming && className === 'ai-message' && safeText.length > 0) {
        let idx = 0;
        
        function typeWriter() {
            if(idx < safeText.length) {
                const chunkSize = Math.floor(Math.random() * 4) + 2;
                idx += chunkSize;
                if(idx > safeText.length) idx = safeText.length;
                
                const currentText = safeText.substring(0, idx);
                textSpan.innerHTML = safeParse(currentText) + '<span class="cursor">▋</span>';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                setTimeout(typeWriter, 12);
            } else {
                textSpan.innerHTML = safeParse(safeText);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
        typeWriter();
    } else {
        if (className === 'ai-message') {
            textSpan.innerHTML = safeParse(safeText);
        } else {
            textSpan.innerText = safeText;
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function speakChatMsg(text, btnElement) {
    try {
        window.speechSynthesis.cancel();
        let speechLang = "en-IN"; 
        
        // Auto detect basic Hinglish/Hindi
        const lowerText = text.toLowerCase();
        if(lowerText.includes("kaise") || lowerText.includes("namaste") || lowerText.includes("kheti") || lowerText.includes("maaf") || lowerText.includes("hoon")) {
            speechLang = "hi-IN";
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 1.0;
        
        const originalHTML = '<i class="fa-solid fa-volume-high"></i>';
        const speakingHTML = '<i class="fa-solid fa-volume-high fa-beat"></i>';
        
        btnElement.innerHTML = speakingHTML;
        
        utterance.onend = () => { btnElement.innerHTML = originalHTML; };
        utterance.onerror = () => { btnElement.innerHTML = originalHTML; };
        
        window.speechSynthesis.speak(utterance);
    } catch(err) {
        console.error("Chat TTS Error:", err);
    }
}

