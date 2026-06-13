import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nodemailer from 'nodemailer';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'https://kumoti.jp';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const INQUIRY_LABELS: Record<string, string> = {
    system:      '業務システム開発のご依頼',
    maintenance: '運用・保守のご依頼',
    web:         'HP / Web制作のご依頼',
    consulting:  '相談・見積もり',
    advisor:     '技術顧問・コンサルティング',
    other:       'その他',
};

function respond(statusCode: number, body: object): APIGatewayProxyResult {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify(body),
    };
}

async function verifyTurnstile(token: string): Promise<boolean> {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            secret:   process.env.TURNSTILE_SECRET_KEY!,
            response: token,
        }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
}

function createTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.mail.eu-west-1.awsapps.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    });
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    try {
        if (!event.body) return respond(400, { message: 'リクエストボディがありません。' });

        const { name, company, email, inquiryType, message, turnstileToken } = JSON.parse(event.body) as {
            name: string;
            company?: string;
            email: string;
            inquiryType: string;
            message: string;
            turnstileToken: string;
        };

        if (!name || !email || !inquiryType || !message || !turnstileToken) {
            return respond(400, { message: '必須項目が不足しています。' });
        }

        const valid = await verifyTurnstile(turnstileToken);
        if (!valid) {
            return respond(400, { message: 'スパム判定を通過できませんでした。しばらくしてから再度お試しください。' });
        }

        const inquiryLabel = INQUIRY_LABELS[inquiryType] ?? inquiryType;

        const transporter = createTransporter();
        await transporter.sendMail({
            from:    process.env.SMTP_USER!,
            to:      process.env.TO_EMAIL!,
            subject: `【kumoti.jp お問い合わせ】${inquiryLabel} - ${name}様`,
            text: [
                `■ お名前         : ${name}`,
                `■ 会社名・屋号   : ${company || '未記入'}`,
                `■ メールアドレス : ${email}`,
                `■ 種別           : ${inquiryLabel}`,
                '',
                '■ お問い合わせ内容:',
                message,
            ].join('\n'),
        });

        return respond(200, { message: 'メッセージを送信しました。ありがとうございます！' });

    } catch (err) {
        console.error(err);
        return respond(500, { message: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。' });
    }
};
