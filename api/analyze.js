export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!contractText) {
    return res.status(400).json({ error: 'نص العقد مفقود' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح الـ API غير معرف في متغيرات البيئة.' });
  }

  const systemPrompt = `أنت مستشار قانوني سعودي خبير في نظام العمل السعودي ولائحته التنفيذية الصادرة عن وزارة الموارد البشرية والتنمية الاجتماعية والقرارات الوزارية المحدثة.
أرسل لك نص عقد عمل، وواجبك هو فحصه بدقة تامة في ضوء أحكام النظام السعودي واللائحة التنفيذية.
يجب أن ترجع الإجابة بصيغة JSON صريحة فقط، بدون أي مقدمات أو نصوص خارج هيكل الـ JSON.

صيغة الـ JSON المطلوبة حصراً:
{
  "status": "نظامي" أو "غير نظامي",
  "summary": "ملخص عام وشامل لنظامية العقد في سطرين",
  "violations": [
    {
      "item": "عنوان المخالفة أو البند (مثال: فترة التجربة)",
      "issue": "وجه المخالفة بالتفصيل مع بيان مخالفتها للنظام",
      "article": "رقم المادة والمصدر (مثال: المادة 53 من نظام العمل)",
      "suggestedClause": "البند المقترح المصحح بصياغة قانونية متكاملة توافق النظام السعودي"
    }
  ]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\n[نص العقد]:\n" + contractText }] }
        ],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(aiText);

    return res.status(200).json(resultJson);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
