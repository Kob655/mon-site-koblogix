import emailjs from '@emailjs/browser';

// --- CONFIGURATION EMAILJS ---
// REMPLACEZ CES VALEURS PAR LES VÔTRES DEPUIS EMAILJS.COM
const SERVICE_ID = 'service_8s8u6y8'; // Ex: service_xxxxx
const TEMPLATE_ID = 'template_dztlmr1'; // Ex: template_xxxxx
const PUBLIC_KEY = 'RcGzUnVOBOVP89ROy'; // Ex: user_xxxxx

export const sendEmail = async (templateParams: Record<string, any>) => {
  try {
  
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Email envoyé avec succès!', response.status, response.text);
    return response;
  } catch (err) {
    console.error('Échec de l\'envoi de l\'email:', err);
    throw err;
  }
};

export const formatOrderForEmail = (customer: any, items: any[], total: number) => {
    const itemsList = items.map(i => `- ${i.name} (${i.price} FCFA)`).join('\n');
    return {
        to_name: "Admin KOBLOGIX",
        from_name: customer.name,
        message: `NOUVELLE COMMANDE REÇUE\n\nClient: ${customer.name}\nEmail: ${customer.email}\nTel: ${customer.phone}\nRef Paiement: ${customer.paymentRef}\n\nDétails:\n${itemsList}\n\nTOTAL: ${total} FCFA`,
        reply_to: customer.email
    };
};

export const formatRegistrationForEmail = (user: {name: string, email: string}) => {
    return {
        to_name: "Admin KOBLOGIX",
        from_name: user.name,
        message: `NOUVELLE INSCRIPTION SITE\n\nNom: ${user.name}\nEmail: ${user.email}\nDate: ${new Date().toLocaleString()}`,
        reply_to: user.email
    };
};
