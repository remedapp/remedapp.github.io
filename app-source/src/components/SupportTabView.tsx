import React from 'react';

export const SupportTabView: React.FC = () => {
  return (
    <section
      aria-labelledby="support-heading"
      className="bg-[#FBF8F3] border border-[#EAE2D3] rounded-2xl px-4 py-12 sm:px-10 sm:py-16"
    >
      <div className="max-w-xl mx-auto bg-white border border-[#EAE2D3] rounded-2xl px-6 py-10 sm:px-12 sm:py-14 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest uppercase text-teal-800">
          APOIO VOLUNTÁRIO
        </p>

        <h2
          id="support-heading"
          className="mt-4 text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight text-balance"
        >
          Se o aplicativo te ajuda, você pode apoiar.
        </h2>

        <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
          O projeto é gratuito e independente. Uma contribuição ajuda a manter o aplicativo, corrigir bugs e criar novas ferramentas gratuitas — sem liberar recursos pagos e sem mudar a privacidade dos usuários.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <a
            href="https://link.mercadopago.com.br/saulomgg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors whitespace-nowrap"
          >
            Link de apoio ↗
          </a>

          <p className="mt-3 text-xs font-medium text-slate-500">
            Mercado Pago · qualquer valor
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            Todos os recursos continuam 100% gratuitos, privados e funcionando offline para qualquer pessoa, apoiando ou não.
          </p>
        </div>
      </div>
    </section>
  );
};
