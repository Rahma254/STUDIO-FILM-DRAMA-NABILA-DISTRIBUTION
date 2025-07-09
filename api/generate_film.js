// File: /api/generate_film.js

export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ambil data dari body request
  const { prompt_type, naskah } = req.body;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  // Pastikan API Key ada
  if (!openrouterKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY tidak diatur di environment variables.' });
  }
  
  // Pastikan naskah/prompt tidak kosong
  if (!naskah) {
    return res.status(400).json({ error: 'Naskah atau prompt tidak boleh kosong.' });
  }

  // Tentukan model dan system prompt berdasarkan tipe
  let system_prompt;
  const model = 'mistralai/mixtral-8x7b-instruct'; // Model yang bagus untuk instruksi

  if (prompt_type === 'film') {
    system_prompt = 'Anda adalah seorang sutradara dan penulis naskah film drama profesional. Kembangkan sinopsis atau potongan adegan berikut menjadi dialog yang kaya, mendalam, dan sinematik. Tambahkan deskripsi aksi dan ekspresi karakter jika perlu. Berikan jawaban dalam format naskah standar.';
  } else if (prompt_type === 'lirik') {
    system_prompt = 'Anda adalah seorang penulis lagu dan penyair berbakat. Buatkan lirik lagu yang indah, puitis, dan menyentuh berdasarkan tema yang diberikan. Struktur lirik harus mencakup bait (verse) dan chorus. Berikan hanya liriknya saja.';
  } else {
    return res.status(400).json({ error: 'Tipe prompt tidak valid.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: naskah }
        ]
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${errorData.error.message || response.statusText}`);
    }

    const data = await response.json();
    const hasilDialog = data.choices[0].message.content;
    
    // Kirim kembali hasil dialog beserta model yang digunakan
    return res.status(200).json({ dialog: hasilDialog, model: data.model });

  } catch (err) {
    console.error(err); // Log error di sisi server
    return res.status(500).json({ error: 'Gagal memproses permintaan', detail: err.message });
  }
}
