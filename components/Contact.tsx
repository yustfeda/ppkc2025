import React from 'react';

const Contact: React.FC = () => {
  const whatsappNumber = "6285817938860";
  const emailAddress = "septianadanu06@gmail.com";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo, saya ingin bertanya mengenai seleksi Paskibraka.")}`;
  const emailLink = `mailto:${emailAddress}?subject=${encodeURIComponent("Pertanyaan Mengenai Seleksi Paskibraka")}`;

  return (
    <div className="bg-brand-light dark:bg-gray-800 flex items-center justify-center min-h-[calc(100vh-5rem)] p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Hubungi Kami</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-8">
          Punya pertanyaan atau butuh bantuan? Jangan ragu untuk menghubungi kami.
        </p>

        <div className="space-y-4">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-base hover:bg-green-600 transition-all duration-300"
          >
            <i className="fab fa-whatsapp text-xl mr-3"></i>
            <span>Chat via WhatsApp</span>
          </a>

          <a
            href={emailLink}
            className="group flex items-center justify-center w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-base hover:bg-blue-600 transition-all duration-300"
          >
            <i className="fas fa-envelope text-xl mr-3"></i>
            <span>Kirim Email</span>
          </a>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
            Tim kami akan merespon secepatnya pada jam kerja.
        </p>
      </div>
    </div>
  );
};

export default Contact;