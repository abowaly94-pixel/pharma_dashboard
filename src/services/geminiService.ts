/**
 * Groq AI Service - Free and Fast
 * Get your free API key from: https://console.groq.com/keys
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MedicineAIResponse {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface TranslationResponse {
  descriptionEn: string;
}

export interface NameTranslationResponse {
  nameEn: string;
}

/**
 * Get active Groq API key from Firestore or env
 */
async function getGroqApiKey(): Promise<string> {
  try {
    const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
    const groqKeysDoc = await getDoc(groqKeysRef);

    if (groqKeysDoc.exists()) {
      const data = groqKeysDoc.data();
      const apiKey = data?.groqApiKey;

      if (apiKey && apiKey.trim()) {
        return apiKey.trim();
      }
    }
  } catch (error) {
    console.error('Error fetching Groq API key from Firestore:', error);
  }

  // Fallback to env variable
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  throw new Error('لم يتم العثور على مفتاح Groq API. يرجى إضافته في صفحة الإعدادات');
}

/**
 * Generate medicine details using Groq AI (Fast and Free)
 */
export async function generateMedicineDetails(medicineName: string, existingEnglishName?: string): Promise<MedicineAIResponse> {
  const apiKey = await getGroqApiKey();

  // تحديد ما إذا كان الاسم عربي أم إنجليزي
  const isArabic = /[\u0600-\u06FF]/.test(medicineName);
  
  let nameEnInstruction = '';
  let nameEnRule = '';
  
  if (existingEnglishName && existingEnglishName.trim()) {
    // إذا كان الاسم الإنجليزي موجود بالفعل، استخدمه كما هو
    nameEnInstruction = `"nameEn": "${existingEnglishName}"`;
    nameEnRule = `استخدم "${existingEnglishName}" كما هو بالضبط - لا تغيره`;
  } else if (isArabic) {
    // إذا كان الاسم عربي فقط، ترجمه للإنجليزي
    nameEnInstruction = `"nameEn": "ترجم كل حرف وكلمة ورقم من الاسم العربي للإنجليزي"`;
    nameEnRule = `⚠️ مهم جداً: ترجم الاسم العربي بالكامل للإنجليزي - لا تحذف أي شيء!
   
   قواعد الترجمة:
   - ترجم كل كلمة عربية للإنجليزي
   - احتفظ بالكلمات الإنجليزية الموجودة كما هي (مثل: macro panthenol)
   - احتفظ بالأرقام كما هي (50، 200، إلخ)
   - ترجم الوحدات: جم → gm، مل → ml، كجم → kg
   - احتفظ بالرموز: | و - و / كما هي
   
   مثال صحيح:
   عربي: "ماكرو بانثينول كريم للبشرة الدهنية والجافة | macro panthenol 50 جم"
   إنجليزي: "Macro Panthenol Cream for Oily and Dry Skin | macro panthenol 50 gm"
   
   ❌ خطأ: "Macro Panthenol Cream for Oily and Dry Skin" (ناقص الجزء الأخير)
   ✅ صح: "Macro Panthenol Cream for Oily and Dry Skin | macro panthenol 50 gm" (كامل)`;
  } else {
    // إذا كان الاسم إنجليزي، استخدمه كما هو
    nameEnInstruction = `"nameEn": "${medicineName}"`;
    nameEnRule = `استخدم "${medicineName}" كما هو`;
  }

  const prompt = `أنت كاتب محتوى تسويقي مصري محترف متخصص في كتابة أوصاف المنتجات الصيدلانية ومنتجات العناية.

اسم المنتج: ${medicineName}

⚠️ قواعد إلزامية - لا تخالفها أبداً:

1. الاسم العربي: احتفظ به كما هو بالضبط "${medicineName}" - لا تغير أي حرف
2. الاسم الإنجليزي: ${nameEnRule}
3. الوصف العربي: 
   - استخدم العربية الفصحى المبسطة فقط
   - ممنوع تماماً أي كلمات أجنبية (إنجليزي، فرنسي، فيتنامي، أي لغة أخرى)
   - استخدم فقط: أحرف عربية (ا-ي) وعلامات الترقيم العربية
   - اكتب بأسلوب تسويقي مصري جذاب كما في علب المنتجات
   - ركز على الفوائد والنتائج فقط
   - لا تذكر مواد كيميائية أو تركيبات معقدة
   - حدد نوع المنتج بدقة (شعر/بشرة/جسم) واكتب وصف مناسب له

4. أمثلة على كلمات ممنوعة في الوصف العربي:
   ❌ cảm giác, feeling, soft, smooth, natural
   ✅ استخدم بدلاً منها: إحساس، ملمس، ناعم، طبيعي

مثال على وصف صحيح:
"استمتع ببشرة نضرة ومرطبة مع بلسم التوت! يمنحك ترطيب عميق وملمس ناعم. غني بمكونات طبيعية تعزز صحة البشرة. رائحة منعشة تدوم طويلاً."

أرجع النتيجة بصيغة JSON فقط:
{
  "nameAr": "${medicineName}",
  ${nameEnInstruction},
  "descriptionAr": "وصف تسويقي بالعربية فقط (3-4 جمل) - بدون أي كلمات أجنبية - يبرز الفوائد بأسلوب مصري جذاب",
  "descriptionEn": "Marketing description in English (3-4 sentences) highlighting benefits"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'أنت كاتب محتوى تسويقي مصري محترف. تكتب أوصاف فعّالة وجذابة للمنتجات بأسلوب مصري تسويقي احترافي زي اللي على علب المنتجات. تكتب بالعربية الفصحى المبسطة فقط - ممنوع تماماً استخدام أي كلمات أجنبية في الوصف العربي.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate medicine details');
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('No response from AI');
    }
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const result: MedicineAIResponse = JSON.parse(jsonMatch[0]);
    
    // Validate response
    if (!result.nameAr || !result.nameEn || !result.descriptionAr || !result.descriptionEn) {
      throw new Error('Incomplete response from AI');
    }

    // Validate Arabic description doesn't contain Latin characters (foreign words)
    const latinPattern = /[a-zA-Z]{2,}/; // 2+ consecutive Latin letters
    if (latinPattern.test(result.descriptionAr)) {
      console.warn('⚠️ AI returned Arabic description with foreign words, retrying...');
      throw new Error('الوصف يحتوي على كلمات أجنبية - يرجى المحاولة مرة أخرى');
    }

    return result;
  } catch (error: any) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

/**
 * Translate Arabic medicine name to English
 */
export async function translateNameToEnglish(arabicName: string): Promise<NameTranslationResponse> {
  const apiKey = await getGroqApiKey();

  const prompt = `أنت مترجم متخصص في أسماء الأدوية والمنتجات الصيدلانية.

اسم الدواء بالعربي: ${arabicName}

⚠️ قواعد الترجمة:
1. إذا كان الاسم أجنبي مكتوب بالعربي (مثل: بنادول، فيفادول، بروفين) - اكتبه بالإنجليزي كما هو معروف عالمياً
2. إذا كان الاسم عربي أصلي - ترجمه حرفياً للإنجليزي
3. احتفظ بالأرقام والرموز كما هي (مثل: 500 mg)
4. لا تضيف أي معلومات إضافية

أمثلة:
- "بنادول" → "Panadol"
- "فيفادول" → "Fevadol"
- "كريم مرطب" → "Moisturizing Cream"
- "شامبو الأطفال" → "Baby Shampoo"

أرجع النتيجة بصيغة JSON فقط:
{
  "nameEn": "English name"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'أنت مترجم متخصص في أسماء الأدوية والمنتجات الصيدلانية. تترجم الأسماء بدقة من العربية للإنجليزية.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to translate name');
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('No response from AI');
    }
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const result: NameTranslationResponse = JSON.parse(jsonMatch[0]);
    
    if (!result.nameEn) {
      throw new Error('Incomplete response from AI');
    }

    return result;
  } catch (error: any) {
    console.error('Groq API Error (Name Translation):', error);
    throw error;
  }
}

/**
 * Translate Arabic description to English
 */
export async function translateDescriptionToEnglish(arabicDescription: string): Promise<TranslationResponse> {
  const apiKey = await getGroqApiKey();

  const prompt = `أنت مترجم محترف. مهمتك ترجمة النص من العربية للإنجليزية بدقة تامة.

النص بالعربي:
${arabicDescription}

⚠️ قواعد الترجمة - مهمة جداً:
1. ترجم النص بالضبط كما هو - كلمة بكلمة
2. حافظ على نفس الأسلوب والتركيب
3. لا تضيف أي كلمات أو معلومات جديدة
4. لا تحذف أي شيء من النص الأصلي
5. لا تغير الأسلوب - إذا كان تسويقي، ترجمه تسويقي - إذا كان بسيط، ترجمه بسيط
6. احتفظ بنفس عدد الجمل والفقرات

مثال:
عربي: "يرطب الشعر ويمنحه لمعان طبيعي. مناسب للاستخدام اليومي."
إنجليزي: "Moisturizes hair and gives it natural shine. Suitable for daily use."

أرجع النتيجة بصيغة JSON فقط:
{
  "descriptionEn": "Exact English translation - word by word, same style, same structure"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'أنت مترجم محترف دقيق. تترجم النصوص من العربية للإنجليزية بدقة تامة - كلمة بكلمة - بدون إضافة أو حذف أو تغيير في الأسلوب. الترجمة يجب أن تكون مطابقة تماماً للنص الأصلي.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to translate description');
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('No response from AI');
    }
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const result: TranslationResponse = JSON.parse(jsonMatch[0]);
    
    // Validate response
    if (!result.descriptionEn) {
      throw new Error('Incomplete translation response');
    }

    return result;
  } catch (error: any) {
    console.error('Groq Translation Error:', error);
    throw error;
  }
}
