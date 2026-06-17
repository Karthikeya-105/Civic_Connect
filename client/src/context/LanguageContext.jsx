import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    en: {
        // Navbar
        home: 'Home', report: 'Report', map: 'Map', myReports: 'My Reports', awards: 'Awards',
        sellPlastic: 'Sell Plastic', sellManure: 'Sell Manure', about: 'About',
        donate: 'Give Back', cleanupDrives: 'Shramdaan',
        profile: 'My Profile', logout: 'Logout', notifications: 'Notifications',

        // Landing
        heroTitle: 'Empowering Citizens.', heroTitle2: 'Building Smart Cities.',
        heroSubtitle: 'Report issues, track progress, and earn rewards for a cleaner, greener India.',
        getStarted: 'Get Started', watchDemo: 'Watch Demo',

        // Report Issue
        reportTitle: 'Report an Issue',
        selectCategory: 'Select Category',
        describeIssue: 'Describe the issue...',
        useMyLoc: 'Use My Location',
        submitReport: 'Submit Report',

        // General
        loading: 'Loading...'
    },
    hi: {
        // Navbar
        home: 'होम', report: 'रिपोर्ट करें', map: 'नक्शा', myReports: 'मेरी रिपोर्ट्स', awards: 'पुरस्कार',
        sellPlastic: 'प्लास्टिक बेचें', sellManure: 'खाद बेचें', about: 'हमारे बारे में',
        donate: 'दान करें', cleanupDrives: 'श्रमदान',
        profile: 'मेरी प्रोफ़ाइल', logout: 'लॉग आउट', notifications: 'सूचनाएं',

        // Landing
        heroTitle: 'नागरिकों को सशक्त बनाना।', heroTitle2: 'स्मार्ट सिटी का निर्माण।',
        heroSubtitle: 'समस्याओं की रिपोर्ट करें, प्रगति को ट्रैक करें और स्वच्छ भारत के लिए पुरस्कार अर्जित करें।',
        getStarted: 'शुरू करें', watchDemo: 'डेमो देखें',

        // Report Issue
        reportTitle: 'समस्या की रिपोर्ट करें',
        selectCategory: 'श्रेणी चुनें',
        describeIssue: 'समस्या का वर्णन करें...',
        useMyLoc: 'मेरे स्थान का उपयोग करें',
        submitReport: 'रिपोर्ट जमा करें',

        // General
        loading: 'लोड हो रहा है...'
    },
    te: {
        // Navbar
        home: 'హోమ్', report: 'రిపోర్ట్ చేయండి', map: 'మ్యాప్', myReports: 'నా రిపోర్ట్స్', awards: 'బహుమతులు',
        sellPlastic: 'ప్లాస్టిక్ అమ్మండి', sellManure: 'ఎరువు అమ్మండి', about: 'మా గురించి',
        donate: 'దానం చేయండి', cleanupDrives: 'శ్రమదాన్',
        profile: 'నా ప్రొఫైల్', logout: 'లాగ్అవుట్', notifications: 'నోటిఫికేషన్లు',

        // Landing
        heroTitle: 'పౌరులను సాధికారపరచడం.', heroTitle2: 'స్మార్ట్ సిటీలను నిర్మించడం.',
        heroSubtitle: 'సమస్యలను నివేదించండి, పురోగతిని ట్రాక్ చేయండి మరియు పరిశుభ్రమైన భారతదేశం కోసం బహుమతులు సంపాదించండి.',
        getStarted: 'ప్రారంభించండి', watchDemo: 'డెమో చూడండి',

        // Report Issue
        reportTitle: 'సమస్యను నివేదించండి',
        selectCategory: 'వర్గాన్ని ఎంచుకోండి',
        describeIssue: 'సమస్యను వివరించండి...',
        useMyLoc: 'నా స్థానాన్ని ఉపయోగించండి',
        submitReport: 'రిపోర్ట్ సమర్పించండి',

        // General
        loading: 'లోడ్ అవుతోంది...'
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('civic_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('civic_lang', lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
