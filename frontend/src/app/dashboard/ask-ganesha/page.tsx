"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Send,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  User,
  Bot,
  RefreshCcw,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTTS } from "@/hooks/use-tts";

interface Message {
  id: string;
  type: 'user' | 'ganesha';
  content: string;
  sources?: string[];
  timestamp: Date;
}

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिंदी (Hindi)' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'Marathi', label: 'मराठी (Marathi)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'Urdu', label: 'اردو (Urdu)' }
];

const TRANSLATIONS: Record<string, any> = {
  English: {
    title: "Ask Ganesha", subtitle: "Your wise mentor for curriculum-aligned learning",
    language: "Language:", grade: "Grade Level:", clearChat: "Clear Chat",
    greeting: "Namaste, dear child! 🙏",
    intro: "I am Ganesha, the remover of obstacles. Ask me any question about your studies, and I will guide you with wisdom from your curriculum. Together, we shall overcome any learning challenges!",
    tryAsking: "Try asking about:", sources: "Sources:", stop: "Stop", listen: "Listen",
    thinking: "Ganesha is thinking...", inputPlaceholder: "Ask your question...", askButton: "Ask",
    footerText: "Answers are based on your curriculum materials. Ask about any topic from your classes!"
  },
  Hindi: {
    title: "गणेश से पूछें", subtitle: "पाठ्यक्रम से जुड़े ज्ञान के लिए आपके गुरु",
    language: "भाषा:", grade: "कक्षा स्तर:", clearChat: "चैट साफ़ करें",
    greeting: "नमस्ते, प्यारे बच्चे! 🙏",
    intro: "मैं गणेश हूँ, विघ्नहर्ता। अपनी पढ़ाई से जुड़ा कोई भी प्रश्न पूछें, और मैं आपके पाठ्यक्रम के ज्ञान से आपका मार्गदर्शन करूंगा। साथ मिलकर, हम हर सीखने की चुनौती को पार करेंगे!",
    tryAsking: "यह पूछने का प्रयास करें:", sources: "स्रोत:", stop: "रुकें", listen: "सुनें",
    thinking: "गणेश सोच रहे हैं...", inputPlaceholder: "अपना प्रश्न पूछें...", askButton: "पूछें",
    footerText: "उत्तर आपके पाठ्यक्रम सामग्री पर आधारित हैं। अपनी कक्षाओं के किसी भी विषय के बारे में पूछें!"
  },
  Tamil: {
    title: "கணேசரிடம் கேளுங்கள்", subtitle: "பாடத்திட்டத்துடன் இணைந்த கற்றலுக்கான உங்கள் குரு",
    language: "மொழி:", grade: "வகுப்பு:", clearChat: "அரட்டையை அழி",
    greeting: "நமஸ்தே, அன்பான குழந்தையே! 🙏",
    intro: "நான் கணேசன், தடைகளை நீக்குபவர். உங்கள் படிப்பைப் பற்றி என்னிடம் எந்தக் கேள்வியும் கேளுங்கள், உங்கள் பாடத்திட்டத்திலிருந்து நான் உங்களுக்கு வழிகாட்டுவேன்.",
    tryAsking: "இவற்றைக் கேட்க முயற்சிக்கவும்:", sources: "ஆதாரங்கள்:", stop: "நிறுத்து", listen: "கேட்க",
    thinking: "கணேசன் சிந்திக்கிறார்...", inputPlaceholder: "உங்கள் கேள்வியைக் கேளுங்கள்...", askButton: "கேள்",
    footerText: "பதில்கள் உங்கள் பாடத்திட்டப் பொருட்களை அடிப்படையாகக் கொண்டவை."
  },
  Telugu: {
    title: "గణేశుడిని అడగండి", subtitle: "మీ పాఠ్యాంశాల అభ్యాసం కోసం మీ గురువు",
    language: "భాష:", grade: "గ్రేడ్ స్థాయి:", clearChat: "చాట్ క్లియర్ చేయండి",
    greeting: "నమస్తే, ప్రియమైన బిడ్డా! 🙏",
    intro: "నేను గణేశుడిని, విఘ్నాలు తొలగించేవాడిని. మీ చదువు గురించి నన్ను ఏదైనా అడగండి, నేను మీ పాఠ్యాంశాల ద్వారా మీకు మార్గనిర్దేశం చేస్తాను.",
    tryAsking: "వీటిని అడగడానికి ప్రయత్నించండి:", sources: "మూలాలు:", stop: "ఆపు", listen: "వినండి",
    thinking: "గణేశుడు ఆలోచిస్తున్నాడు...", inputPlaceholder: "మీ ప్రశ్న అడగండి...", askButton: "అడగండి",
    footerText: "సమాధానాలు మీ పాఠ్యాంశాల ఆధారంగా ఉంటాయి."
  },
  Kannada: {
    title: "ಗಣೇಶನನ್ನು ಕೇಳಿ", subtitle: "ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮದ ಕಲಿಕೆಗಾಗಿ ಮಾರ್ಗದರ್ಶಕ",
    language: "ಭಾಷೆ:", grade: "ತರಗತಿ:", clearChat: "ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ",
    greeting: "ನಮಸ್ತೆ, ಪ್ರೀತಿಯ ಮಗುವೇ! 🙏",
    intro: "ನಾನು ಗಣೇಶ, ವಿಘ್ನ ನಿವಾರಕ. ನಿಮ್ಮ ಅಧ್ಯಯನದ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ, ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮದ ಜ್ಞಾನದಿಂದ ನಾನು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ.",
    tryAsking: "ಇದನ್ನು ಕೇಳಿ ಪ್ರಯತ್ನಿಸಿ:", sources: "ಮೂಲಗಳು:", stop: "ನಿಲ್ಲಿಸಿ", listen: "ಆಲಿಸಿ",
    thinking: "ಗಣೇಶ ಯೋಚಿಸುತ್ತಿದ್ದಾರೆ...", inputPlaceholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ...", askButton: "ಕೇಳಿ",
    footerText: "ಉತ್ತರಗಳು ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮದ ವಸ್ತುಗಳನ್ನು ಆಧರಿಸಿವೆ."
  },
  Malayalam: {
    title: "ഗണേശനോട് ചോദിക്കുക", subtitle: "നിങ്ങളുടെ പഠനത്തിനായുള്ള മാർഗ്ഗദർശി",
    language: "ഭാഷ:", grade: "ക്ലാസ്:", clearChat: "ചാറ്റ് മായ്‌ക്കുക",
    greeting: "നമസ്‌തേ, പ്രിയ കുട്ടീ! 🙏",
    intro: "ഞാൻ ഗണേശൻ, തടസ്സങ്ങൾ മാറ്റുന്നവൻ. നിങ്ങളുടെ പഠനത്തെക്കുറിച്ച് ഏത് ചോദ്യവും ചോദിക്കുക, നിങ്ങളുടെ സിലബസിൽ നിന്ന് ഞാൻ നിങ്ങളെ നയിക്കും.",
    tryAsking: "ഇവ ചോദിക്കാൻ ശ്രമിക്കുക:", sources: "ഉറവിടങ്ങൾ:", stop: "നിർത്തുക", listen: "കേൾക്കുക",
    thinking: "ഗണേശൻ ചിന്തിക്കുന്നു...", inputPlaceholder: "നിങ്ങളുടെ ചോദ്യം ചോദിക്കുക...", askButton: "ചോദിക്കുക",
    footerText: "ഉത്തരങ്ങൾ നിങ്ങളുടെ സിലബസിലെ വസ്തുക്കളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്."
  },
  Marathi: {
    title: "गणेशाला विचारा", subtitle: "तुमच्या अभ्यासासाठी तुमचा मार्गदर्शक",
    language: "भाषा:", grade: "इयत्ता:", clearChat: "चॅट साफ करा",
    greeting: "नमस्ते, लाडक्या मुला! 🙏",
    intro: "मी गणेश आहे, विघ्नहर्ता। तुझ्या अभ्यासाबद्दल मला कोणताही प्रश्न विचार, आणि मी तुला तुझ्या अभ्यासक्रमातील ज्ञानाने मार्गदर्शन करेन.",
    tryAsking: "हे विचारून पहा:", sources: "स्रोत:", stop: "थांबवा", listen: "ऐका",
    thinking: "गणेश विचार करत आहेत...", inputPlaceholder: "तुमचा प्रश्न विचारा...", askButton: "विचारा",
    footerText: "उत्तरे तुमच्या अभ्यासक्रमाच्या वस्तूंवर आधारित आहेत."
  },
  Bengali: {
    title: "গণেশকে জিজ্ঞাসা করুন", subtitle: "পাঠ্যক্রম ভিত্তিক শিক্ষার জন্য আপনার মেন্টর",
    language: "ভাষা:", grade: "শ্রেণী:", clearChat: "চ্যাট মুছুন",
    greeting: "নমস্তে, প্রিয় শিশু! 🙏",
    intro: "আমি গণেশ, বিঘ্ন বিনাশক। আপনার পড়াশোনা নিয়ে আমাকে যেকোনো প্রশ্ন জিজ্ঞাসা করুন, এবং আমি আপনার পাঠ্যক্রম থেকে আপনাকে গাইড করব।",
    tryAsking: "এটি জিজ্ঞাসা করার চেষ্টা করুন:", sources: "উৎস:", stop: "থামুন", listen: "শুনুন",
    thinking: "গণেশ ভাবছেন...", inputPlaceholder: "আপনার প্রশ্ন জিজ্ঞাসা করুন...", askButton: "জিজ্ঞাসা করুন",
    footerText: "উত্তর আপনার পাঠ্যক্রমের উপকরণগুলির উপর ভিত্তি করে করা হয়."
  },
  Gujarati: {
    title: "ગણેશને પૂછો", subtitle: "અભ્યાસક્રમ આધારિત શિક્ષણ માટે તમારા માર્ગદર્શક",
    language: "ભાષા:", grade: "ધોરણ:", clearChat: "ચેટ કાઢી નાખો",
    greeting: "નમસ્તે, વહાલા બાળક! 🙏",
    intro: "હું ગણેશ છું, વિઘ્નહર્તા। તમારા અભ્યાસ વિશે મને કંઈપણ પૂછો, અને હું તમારા અભ્યાસક્રમના જ્ઞાનથી તમને માર્ગદર્શન આપીશ.",
    tryAsking: "આ પૂછવાનો પ્રયાસ કરો:", sources: "સ્ત્રોતો:", stop: "પ્રતિબદ્ધ કરો", listen: "સાંભળો",
    thinking: "ગણેશ વિચારી રહ્યા છે...", inputPlaceholder: "તમારો પ્રશ્ન પૂછો...", askButton: "પૂછો",
    footerText: "જવાબો તમારા અભ્યાસક્રમની સામગ્રી પર આધારિત છે."
  },
  Punjabi: {
    title: "ਗਣੇਸ਼ ਨੂੰ ਪੁੱਛੋ", subtitle: "ਪਾਠਕ੍ਰਮ-ਅਧਾਰਿਤ ਸਿੱਖਣ ਲਈ ਤੁਹਾਡਾ ਗੁਰੂ",
    language: "ਭਾਸ਼ਾ:", grade: "ਗ੍ਰੇਡ:", clearChat: "ਗੱਲਬਾਤ ਸਾਫ਼ ਕਰੋ",
    greeting: "ਨਮਸਤੇ, ਪਿਆਰੇ ਬੱਚੇ! 🙏",
    intro: "ਮੈਂ ਗਣੇਸ਼ ਹਾਂ, ਵਿਘਨ ਹਰਤਾ। ਮੈਨੂੰ ਆਪਣੀ ਪੜ੍ਹਾਈ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ, ਅਤੇ ਮੈਂ ਤੁਹਾਡੇ ਪਾਠਕ੍ਰਮ ਤੋਂ ਤੁਹਾਡੀ ਮਾਰਗਦਰਸ਼ਨ ਕਰਾਂਗਾ।",
    tryAsking: "ਇਹ ਪੁੱਛਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ:", sources: "ਸਰੋਤ:", stop: "ਰੋਕੋ", listen: "ਸੁਣੋ",
    thinking: "ਗਣੇਸ਼ ਸੋਚ ਰਹੇ ਹਨ...", inputPlaceholder: "ਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ...", askButton: "ਪੁੱਛੋ",
    footerText: "ਜਵਾਬ ਤੁਹਾਡੇ ਪਾਠਕ੍ਰਮ ਸਮੱਗਰੀ 'ਤੇ ਅਧਾਰਤ ਹਨ।"
  },
  Odia: {
    title: "ଗଣେଶଙ୍କୁ ପଚାରନ୍ତୁ", subtitle: "ଆପଣଙ୍କ ପାଠ୍ୟକ୍ରମ ଶିକ୍ଷା ପାଇଁ ଗୁରୁ",
    language: "ଭାଷା:", grade: "ଶ୍ରେଣୀ:", clearChat: "ଚାଟ୍ ଖାଲି କରନ୍ତୁ",
    greeting: "ନମସ୍ତେ, ପ୍ରିୟ ପିଲା! 🙏",
    intro: "ମୁଁ ଗଣେଶ, ବିଘ୍ନନାଶକ। ତୁମର ପାଠ୍ୟକ୍ରମ ବିଷୟରେ କିଛି ବି ପଚାର, ମୁଁ ତୁମକୁ ସାହାଯ୍ୟ କରିବି।",
    tryAsking: "ଏହା ପଚାରିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ:", sources: "ସ୍ରୋତ:", stop: "ବନ୍ଦ କରନ୍ତୁ", listen: "ଶୁଣନ୍ତୁ",
    thinking: "ଗଣେଶ ଭାବୁଛନ୍ତି...", inputPlaceholder: "ଆପଣଙ୍କର ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...", askButton: "ପଚାରନ୍ତୁ",
    footerText: "ଉତ୍ତର ଆପଣଙ୍କ ପାଠ୍ୟକ୍ରମ ସାମଗ୍ରୀ ଉପରେ ଆଧାରିତ।"
  },
  Urdu: {
    title: "گنیش سے پوچھیں", subtitle: "اپنے نصاب سے متعلق سیکھنے کے لئے آپ کا رہنما",
    language: "زبان:", grade: "کلاس:", clearChat: "چیٹ صاف کریں",
    greeting: "نمستے، پیارے بچے! 🙏",
    intro: "میں گنیش ہوں، رکاوٹوں کو دور کرنے والا۔ اپنی پڑھائی کے بارے میں مجھ سے کوئی بھی سوال پوچھیں، اور میں آپ کے نصاب کے مطابق آپ کی رہنمائی کروں گا۔",
    tryAsking: "یہ پوچھنے کی کوشش کریں:", sources: "ذرائع:", stop: "رکیں", listen: "سنیں",
    thinking: "گنیش سوچ رہے ہیں...", inputPlaceholder: "اپنا سوال پوچھیں...", askButton: "پوچھیں",
    footerText: "جوابات آپ کے نصاب کے مواد پر مبنی ہیں۔"
  }
};

const GRADE_LEVELS = [
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
];

const LOCALIZED_QUESTIONS: Record<string, string[]> = {
  English: [
    "What is photosynthesis and how does it work?",
    "Can you explain the water cycle?",
    "How do plants make their food?",
    "What are the planets in our solar system?",
    "Tell me about the freedom struggle of India",
    "What is the difference between weather and climate?",
  ],
  Hindi: [
    "प्रकाश संश्लेषण क्या है और यह कैसे काम करता है?",
    "क्या आप जल चक्र समझा सकते हैं?",
    "पौधे अपना भोजन कैसे बनाते हैं?",
    "हमारे सौर मंडल में कौन-कौन से ग्रह हैं?",
    "भारत के स्वतंत्रता संग्राम के बारे में बताएं",
    "मौसम और जलवायु में क्या अंतर है?",
  ],
  Tamil: [
    "ஒளிச்சேர்க்கை என்றால் என்ன, அது எவ்வாறு செயல்படுகிறது?",
    "நீர் சுழற்சியை விளக்க முடியுமா?",
    "தாவரங்கள் தங்கள் உணவை எவ்வாறு தயாரிக்கின்றன?",
    "நம் சூரிய குடும்பத்தில் உள்ள கோள்கள் எவை?",
    "இந்தியாவின் சுதந்திரப் போராட்டத்தைப் பற்றி சொல்லுங்கள்",
    "வானிலைக்கும் காலநிலைகும் உள்ள வேறுபாடு என்ன?",
  ],
  Telugu: [
    "కిరణజన్య సంయోగక్రియ అంటే ఏమిటి మరియు అది ఎలా పనిచేస్తుంది?",
    "నీటి చక్రాన్ని మీరు వివరించగలరా?",
    "మొక్కలు తమ ఆహారాన్ని ఎలా తయారు చేసుకుంటాయి?",
    "మన సౌర కుటుంబంలోని గ్రహాలు ఏమిటి?",
    "భారతదేశ స్వాతంత్ర్య పోరాటం గురించి చెప్పండి",
    "వాతావరణం మరియు శీతోష్ణస్థితి మధ్య తేడా ఏమిటి?",
  ],
  Kannada: [
    "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಎಂದರೇನು ಮತ್ತು ಅದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?",
    "ನೀರಿನ ಚಕ್ರವನ್ನು ವಿವರಿಸುವಿರಾ?",
    "ಸಸ್ಯಗಳು ತಮ್ಮ ಆಹಾರವನ್ನು ಹೇಗೆ ತಯಾರಿಸುತ್ತವೆ?",
    "ನಮ್ಮ ಸೌರವ್ಯೂಹದಲ್ಲಿರುವ ಗ್ರಹಗಳು ಯಾವುವು?",
    "ಭಾರತದ ಸ್ವಾತಂತ್ರ್ಯ ಸಂಗ್ರಾಮದ ಬಗ್ಗೆ ತಿಳಿಸಿ",
    "ಹವಾಮಾನ ಮತ್ತು ವಾಯುಗುಣದ ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು?",
  ],
  Malayalam: [
    "പ്രകാശസംശ്ലേഷണം എന്നാൽ എന്ത്, അത് എങ്ങനെ പ്രവർത്തിക്കുന്നു?",
    "ജലചക്രം വിശദീകരിക്കാമോ?",
    "സസ്യങ്ങൾ എങ്ങനെയാണ് ആഹാരം നിർമ്മിക്കുന്നത്?",
    "നമ്മുടെ സൗരയൂഥത്തിലെ ഗ്രഹങ്ങൾ ഏതൊക്കെയാണ്?",
    "ഇന്ത്യയുടെ സ്വാതന്ത്ര്യ സമരത്തെക്കുറിച്ച് പറയുക",
    "കാലാവസ്ഥയും കാലാവസ്ഥാ വ്യതിയാനവും തമ്മിലുള്ള വ്യത്യാസം എന്താണ്?",
  ],
  Marathi: [
    "प्रकाशसंश्लेषण म्हणजे काय आणि ते कसे कार्य करते?",
    "तुम्ही जलचक्र समजावून सांगू शकता का?",
    "वनस्पती त्यांचे अन्न कसे तयार करतात?",
    "आपल्या सूर्यमालेतील ग्रह कोणते आहेत?",
    "भारताच्या स्वातंत्र्यलढ्याबद्दल सांगा",
    "हवामान आणि हवामानातील फरक काय आहे?",
  ],
  Bengali: [
    "সালোকসংশ্লেষণ কি এবং এটি কীভাবে কাজ করে?",
    "আপনি কি জলচক্র ব্যাখ্যা করতে পারেন?",
    "গাছপালা কীভাবে তাদের খাদ্য তৈরি করে?",
    "আমাদের সৌরজগতের গ্রহগুলি কী কী?",
    "ভারতের স্বাধীনতা সংগ্রাম সম্পর্কে আমাকে বলুন",
    "আবহাওয়া এবং জলবায়ুর মধ্যে পার্থক্য কী?",
  ],
  Gujarati: [
    "પ્રકાશસંશ્લેષણ શું છે અને તે કેવી રીતે કાર્ય કરે છે?",
    "શું તમે જળ ચક્ર સમજાવી શકો છો?",
    "છોડ પોતાનો ખોરાક કેવી રીતે બનાવે છે?",
    "આપણા સૂર્યમંડળના ગ્રહો કયા છે?",
    "ભારતના સ્વાતંત્ર્ય સંગ્રામ વિશે મને કહો",
    "હવામાન અને આબોહવા વચ્ચે શું તફાવત છે?",
  ],
  Punjabi: [
    "ਪ੍ਰਕਾਸ਼ ਸੰਸ਼ਲੇਸ਼ਣ ਕੀ ਹੈ ਅਤੇ ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ?",
    "ਕੀ ਤੁਸੀਂ ਪਾਣੀ ਦੇ ਚੱਕਰ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦੇ ਹੋ?",
    "ਪੌਦੇ ਆਪਣੀ ਖੁਰਾਕ ਕਿਵੇਂ ਬਣਾਉਂਦੇ ਹਨ?",
    "ਸਾਡੇ ਸੂਰਜੀ ਮੰਡਲ ਵਿੱਚ ਕਿਹੜੇ ਗ੍ਰਹਿ ਹਨ?",
    "ਭਾਰਤ ਦੇ ਸੁਤੰਤਰਤਾ ਸੰਗਰਾਮ ਬਾਰੇ ਮੈਨੂੰ ਦੱਸੋ",
    "ਮੌਸਮ ਅਤੇ ਜਲਵਾਯੂ ਵਿੱਚ ਕੀ ਅੰਤਰ ਹੈ?",
  ],
  Odia: [
    "ଆଲୋକଶ୍ଳେଷଣ କଣ ଏବଂ ଏହା କିପରି କାମ କରେ?",
    "ଆପଣ ଜଳ ଚକ୍ର ବୁଝାଇ ପାରିବେ କି?",
    "ଗଛ କିପରି ଖାଦ୍ୟ ପ୍ରସ୍ତୁତ କରେ?",
    "ଆମ ସୌର ମଣ୍ଡଳରେ କେଉଁ ଗ୍ରହ ଅଛନ୍ତି?",
    "ଭାରତର ସ୍ୱାଧୀନତା ସଂଗ୍ରାମ ବିଷୟରେ କୁହନ୍ତୁ",
    "ପାଣିପାଗ ଏବଂ ଜଳବାୟୁ ମଧ୍ୟରେ କ'ଣ ପାର୍ଥକ୍ୟ?",
  ],
  Urdu: [
    "ضیائی تالیف کیا ہے اور یہ کیسے کام کرتا ہے؟",
    "کیا آپ پانی کے چکر کی وضاحت کر سکتے ہیں؟",
    "پودے اپنی خوراک کیسے بناتے ہیں؟",
    "ہمارے نظام شمسی کے سیارے کون سے ہیں؟",
    "مجھے ہندوستان کی آزادی کی جدوجہد کے بارے میں بتائیں",
    "موسم اور آب و ہوا کے درمیان کیا فرق ہے؟",
  ]
};

export default function AskGaneshaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { speak, cancel, isSpeaking } = useTTS();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState(user?.preferred_language || 'English');
  const [gradeLevel, setGradeLevel] = useState(user?.grade_level ? String(user.grade_level) : '5');
  const [loading, setLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async (questionText?: string) => {
    const q = questionText || question;
    if (!q.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/ask-ganesha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          language,
          grade_level: gradeLevel,
        }),
      });

      const data = await response.json();

      if (data.error) {
        // Give user-friendly messages for common errors
        let title = "Error";
        let description = data.error;

        if (data.error.includes('quota') || data.error.includes('429') || data.error.includes('RESOURCE_EXHAUSTED')) {
          title = "API Quota Exceeded";
          description = "The Gemini API key has run out of quota. Please get a new key at aistudio.google.com/app/apikey and update the GOOGLE_AI_API_KEY in your .env file, then restart the server.";
        } else if (response.status === 401) {
          title = "Not Logged In";
          description = "Please log in to use Ask Ganesha.";
        } else if (data.error.includes('not configured')) {
          title = "API Key Missing";
          description = "Gemini API key is not set. Add GOOGLE_AI_API_KEY to your .env file.";
        }

        toast({ title, description, variant: "destructive" });
        return;
      }

      const ganeshaMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ganesha',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, ganeshaMessage]);

    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not reach the server. Make sure pnpm run dev is running.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }

  };

  const handleSpeak = (message: Message) => {
    if (speakingMessageId === message.id && isSpeaking) {
      cancel();
      setSpeakingMessageId(null);
    } else {
      speak(message.content);
      setSpeakingMessageId(message.id);
    }
  };

  const clearChat = () => {
    setMessages([]);
    cancel();
    setSpeakingMessageId(null);
  };

  if (!user) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS['English'];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl">
            🙏
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">{t.title}</h1>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Row */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Label htmlFor="language" className="text-sm whitespace-nowrap">{t.language}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="grade" className="text-sm whitespace-nowrap">{t.grade}</Label>
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger id="grade" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(grade => (
                <SelectItem key={grade.value} value={grade.value}>
                  {grade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="ml-auto gap-2">
            <RefreshCcw className="h-4 w-4" />
            {t.clearChat}
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-5xl mb-6 shadow-lg">
                🙏
              </div>
              <h2 className="text-2xl font-semibold mb-2">{t.greeting}</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                {t.intro}
              </p>

              <div className="w-full max-w-2xl">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {t.tryAsking}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(LOCALIZED_QUESTIONS[language] || LOCALIZED_QUESTIONS['English']).map((q, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-auto py-3 px-4 text-left justify-start text-sm"
                      onClick={() => handleAsk(q)}
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                      <span className="line-clamp-2">{q}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ganesha' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                      🙏
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      <CardContent className="p-4">
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {t.sources}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      {message.type === 'ganesha' && (
                        <CardFooter className="p-2 pt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSpeak(message)}
                            className="gap-2 text-xs"
                          >
                            {speakingMessageId === message.id && isSpeaking ? (
                              <>
                                <VolumeX className="h-4 w-4" />
                                {t.stop}
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4" />
                                {t.listen}
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1 px-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                    🙏
                  </div>
                  <Card className="bg-muted">
                    <CardContent className="p-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">{t.thinking}</span>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
            className="flex gap-2"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.inputPlaceholder}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !question.trim()} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t.askButton}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t.footerText}
          </p>
        </div>
      </Card>
    </div>
  );
}
