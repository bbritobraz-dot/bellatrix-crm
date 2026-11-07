import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera o PDF do orçamento no servidor (envio por e-mail) sem empacotar a biblioteca
  serverExternalPackages: ["@react-pdf/renderer"],
  // Garante que o logo esteja disponível no servidor para o PDF do e-mail
  outputFileTracingIncludes: {
    "/*": ["./public/logo.png"],
  },
};

export default nextConfig;
