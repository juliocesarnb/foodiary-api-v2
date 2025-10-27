# 🍽️ Foodiary API v2

> API serverless para contagem de calorias com processamento de áudio e imagem usando IA

[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20SQS-FF9900?logo=amazon-aws)](https://aws.amazon.com/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-FD5750?logo=serverless)](https://www.serverless.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper%20%7C%20GPT--4-412991?logo=openai)](https://openai.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## 📋 Sobre o Projeto

Foodiary é uma API backend que permite aos usuários registrar refeições através de **áudio** ou **imagem**, processando-as com Inteligência Artificial para extrair informações nutricionais detalhadas.

**Funcionalidades principais:**
- 🎤 Transcrição de áudio com OpenAI Whisper
- 📸 Análise de imagens com GPT-4 Vision
- 🥗 Extração automática de calorias e macronutrientes
- 📊 Cálculo personalizado de metas nutricionais
- 🔐 Autenticação JWT
- ☁️ Arquitetura 100% serverless

---

## 🏗️ Arquitetura

### Event-Driven Architecture
```
┌─────────────┐     ┌────────┐     ┌──────────────────┐     ┌─────┐     ┌─────────────────┐
│   Cliente   │────▶│  API   │────▶│ Presigned URL S3 │────▶│ S3  │────▶│ S3 Event Trigger│
│   Mobile    │     │Gateway │     │   (upload direto)│     │     │     │                 │
└─────────────┘     └────────┘     └──────────────────┘     └─────┘     └────────┬────────┘
                                                                                   │
                                                                                   ▼
                    ┌──────────┐     ┌─────────────────┐     ┌────────────────────┐
                    │ Database │◀────│ Lambda Process  │◀────│    SQS Queue       │
                    │ (Drizzle)│     │  Meal (300s)    │     │ (meals-queue-v3)   │
                    └──────────┘     └─────────────────┘     └────────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   OpenAI API     │
                                     │ Whisper + GPT-4  │
                                     └──────────────────┘
```

### Componentes AWS

| Serviço | Uso | Configuração |
|---------|-----|--------------|
| **Lambda** | Processamento serverless | Node.js 22.x, ARM64 |
| **S3** | Armazenamento de áudios/imagens | `jstacklab-v3-foodiary-uploads` |
| **SQS** | Fila assíncrona + DLQ | VisibilityTimeout: 360s |
| **API Gateway** | HTTP API endpoints | REST endpoints |
| **CloudWatch** | Logs e monitoramento | Retenção ilimitada |

---

## 🚀 Tecnologias

### Backend
- **Runtime:** Node.js 22.x
- **Language:** TypeScript
- **Framework:** Serverless Framework v4
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Authentication:** JWT + bcryptjs

### Cloud & Infrastructure
- **AWS Lambda** - Compute serverless
- **AWS S3** - Object storage
- **AWS SQS** - Message queue
- **AWS API Gateway** - HTTP endpoints
- **CloudWatch** - Logging

### AI & ML
- **OpenAI Whisper** - Transcrição de áudio
- **OpenAI GPT-4o-mini** - Análise nutricional

---

## 📦 Instalação

### Pré-requisitos
- Node.js 22.x ou superior
- AWS CLI configurado
- Conta AWS com permissões adequadas
- Conta OpenAI com créditos

### 1. Clone o repositório
```bash
git clone https://github.com/juliocesarnb/foodiary-api-v2.git
cd foodiary-api-v2
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=seu-secret-jwt-super-seguro
OPENAI_API_KEY=sk-proj-...
```

### 4. Configure suas credenciais AWS
```bash
aws configure
```

### 5. Deploy para AWS
```bash
serverless deploy
```

Após o deploy, você verá a URL da API:
```
endpoint: https://xxxxx.execute-api.us-east-1.amazonaws.com
```

---

## 📚 Endpoints da API

### Autenticação

#### `POST /signup`
Cria uma nova conta de usuário.

**Body:**
```json
{
  "goal": "lose|maintain|gain",
  "gender": "male|female",
  "birthDate": "1990-01-01",
  "height": 175,
  "weight": 80,
  "activityLevel": 3,
  "account": {
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /signin`
Autentica um usuário existente.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Usuário (requer autenticação)

#### `GET /me`
Retorna os dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "calories": 2000,
    "proteins": 150,
    "carbohydrates": 250,
    "fats": 67
  }
}
```

---

### Refeições (requer autenticação)

#### `POST /meals`
Cria uma nova refeição e retorna URL para upload.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "fileType": "audio/m4a" | "image/jpeg"
}
```

**Response:**
```json
{
  "mealId": "uuid",
  "uploadURL": "https://bucket.s3.amazonaws.com/..."
}
```

**Fluxo:**
1. Chame este endpoint
2. Faça PUT do arquivo para `uploadURL`
3. O S3 dispara evento automaticamente
4. Faça polling em `GET /meals/{mealId}` até `status === "success"`

#### `GET /meals`
Lista refeições de um dia específico.

**Query Params:**
```
?date=2025-01-15
```

**Response:**
```json
{
  "meals": [
    {
      "id": "uuid",
      "name": "Café da manhã",
      "icon": "🍳",
      "createdAt": "2025-01-15T08:30:00Z",
      "foods": [
        {
          "name": "Ovos mexidos",
          "quantity": "2 unidades",
          "calories": 140,
          "proteins": 12,
          "carbohydrates": 1,
          "fats": 10
        }
      ]
    }
  ]
}
```

#### `GET /meals/{mealId}`
Retorna detalhes de uma refeição específica.

**Response:**
```json
{
  "meal": {
    "id": "uuid",
    "name": "Almoço",
    "icon": "🍽️",
    "status": "success|processing|uploading|failed",
    "createdAt": "2025-01-15T12:00:00Z",
    "foods": [...]
  }
}
```

**Status:**
- `uploading` - Arquivo sendo enviado para S3
- `processing` - IA analisando conteúdo
- `success` - Processamento concluído
- `failed` - Erro no processamento

---

## ⚙️ Configuração de Lambdas

### Funções HTTP (signin, signup, me, etc.)
```yaml
timeout: 30s
memorySize: 256MB
```

### fileUploadedEvent
```yaml
timeout: 30s
memorySize: 256MB
trigger: S3 ObjectCreated:*
```

### processMeal (IA)
```yaml
timeout: 300s (5 minutos)
memorySize: 2048MB (2GB)
trigger: SQS meals-queue-v3
batchSize: 1
```

---

## 🔒 Permissões IAM

A role das Lambdas possui:

**S3:**
- `s3:PutObject` - Upload de arquivos
- `s3:GetObject` - Download de arquivos

**SQS:**
- `sqs:SendMessage` - Enviar mensagens
- `sqs:ReceiveMessage` - Receber mensagens
- `sqs:DeleteMessage` - Remover da fila
- `sqs:GetQueueAttributes` - Ler atributos

**CloudWatch:**
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

---

## 🧪 Testando Localmente

### Desenvolvimento local (sem Lambdas reais)
```bash
npm run dev
# ou
serverless offline
```

**⚠️ Importante:** `serverless offline` só funciona para testes de backend. Para testar com app mobile, sempre use a API deployada na AWS.

---

## 📊 Monitoramento

### CloudWatch Logs

Grupos de logs disponíveis:
```
/aws/lambda/foodiary-v2-api-dev2-signin
/aws/lambda/foodiary-v2-api-dev2-signup
/aws/lambda/foodiary-v2-api-dev2-me
/aws/lambda/foodiary-v2-api-dev2-createMeal
/aws/lambda/foodiary-v2-api-dev2-listMeals
/aws/lambda/foodiary-v2-api-dev2-getMealById
/aws/lambda/foodiary-v2-api-dev2-fileUploadedEvent
/aws/lambda/foodiary-v2-api-dev2-processMeal
```

### Verificar processamento de refeições
```bash
# Listar mensagens na fila
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/.../meals-queue-v3

# Verificar DLQ (erros)
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/.../meals-queue-v3-dlq
```

---

## 🐛 Troubleshooting

### Lambda dando timeout
**Problema:** Processamento de IA demora muito.

**Solução:**
- Aumente `timeout` no `serverless.yml`
- Verifique se `memorySize` está adequada (2GB recomendado)
- Confirme que `VisibilityTimeout` do SQS > timeout da Lambda

### "429 - Quota exceeded" da OpenAI
**Problema:** Créditos esgotados.

**Solução:**
- Adicione créditos em https://platform.openai.com/settings/organization/billing/overview
- Implemente rate limiting no frontend
- Configure alertas de quota

### App fica em loading infinito
**Problema:** Frontend não recebe status "success".

**Debug:**
1. Verifique logs do CloudWatch
2. Confirme se arquivo chegou no S3
3. Verifique mensagens no SQS
4. Teste com mock da IA (descomente código em `ai.ts`)

### "localhost:4571" no upload
**Problema:** `serverless-offline` rodando enquanto testa no mobile.

**Solução:**
- Pare `serverless-offline` (Ctrl+C)
- Use apenas a API deployada na AWS
- Atualize `httpClient.ts` com URL de produção

---

## 🗂️ Estrutura do Projeto

```
foodiary-api-v2/
├── src/
│   ├── clients/           # AWS SDK clients (S3, SQS)
│   ├── controllers/       # Lógica de negócio dos endpoints
│   ├── db/               # Configuração Drizzle ORM
│   │   ├── index.ts
│   │   └── schema.ts     # Schema do banco
│   ├── functions/        # Handlers das Lambdas
│   ├── lib/              # Utilitários (JWT, cálculos)
│   ├── queues/           # Processamento de filas (ProcessMeal)
│   ├── services/         # Integrações externas (OpenAI)
│   ├── types/            # TypeScript types
│   └── utils/            # Helpers HTTP
├── serverless.yml        # Configuração Serverless Framework
├── package.json
├── tsconfig.json
└── .env
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto foi desenvolvido como parte do evento **Jstack-lab** ministrado por **Mateus Silva**.

---

## 👨‍💻 Autor

**Julio Cesar**

- GitHub: [@juliocesarnb](https://github.com/juliocesarnb)
- LinkedIn: [Seu LinkedIn]

---

## 🙏 Agradecimentos

- **Mateus Silva** e **Jstack-lab** pelo evento e conhecimento compartilhado
- Comunidade AWS e Serverless Framework
- OpenAI pela API de IA

---

## 📚 Recursos Úteis

- [Documentação AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

---

**⭐ Se este projeto foi útil, deixe uma estrela no GitHub!**
