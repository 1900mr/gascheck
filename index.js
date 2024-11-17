const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs');  // استيراد مكتبة exceljs
require('dotenv').config();  // إذا كنت تستخدم متغيرات بيئية
const express = require('express');  // إضافة Express لتشغيل السيرفر

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();

// إضافة Route للعنوان الجذر '/'
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// تحديد المنفذ باستخدام متغير البيئة PORT
const port = process.env.PORT || 4000;  // إذا لم يكن هناك PORT في البيئة، سيعمل على 4000

// استبدل 'YOUR_BOT_TOKEN_HERE' بالتوكن الخاص بالبوت
const token = process.env.TELEGRAM_BOT_TOKEN || '7203035834:AAFsWjHtF2q3p-dGH_6mm9IykYqX4Erfrnc';

// إنشاء البوت مع التفعيل
const bot = new TelegramBot(token, { polling: true });

// تحميل البيانات من ملف Excel
let data = {};

// دالة للمساعدة في التحقق من وجود القيمة قبل استخدام trim
const getValue = (value) => value ? value.trim() : "غير متوفر";

// قراءة البيانات من ملف Excel باستخدام exceljs
async function loadDataFromExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('gas18-11-2024.xlsx');  // تأكد من أن اسم الملف صحيح
        const worksheet = workbook.worksheets[0];  // الحصول على أول ورقة عمل
        
        worksheet.eachRow((row, rowNumber) => {
            const idNumber = getValue(row.getCell(1).value);  // أول عمود يحتوي على رقم الهوية
            const name = getValue(row.getCell(2).value);  // ثاني عمود يحتوي على اسم الطالب
            const phoneNumber = getValue(row.getCell(3).value);  // رقم الجوال
            const province = getValue(row.getCell(4).value);  // المحافظة
            const district = getValue(row.getCell(12).value);  // المحافظة الثانية
            const city = getValue(row.getCell(5).value);  // المدينة
            const area = getValue(row.getCell(6).value);  // الحي / المنطقة
            const distributorId = getValue(row.getCell(7).value);  // هوية الموزع
            const distributorName = getValue(row.getCell(8).value);  // اسم الموزع
            const distributorPhone = getValue(row.getCell(9).value);  // رقم جوال الموزع
            const status = getValue(row.getCell(10).value);  // الحالة
            const orderDate = getValue(row.getCell(11).value);  // تاريخ الطلب
            
            // تخزين البيانات في كائن باستخدام رقم الهوية كمفتاح
            if (idNumber && name) {
                data[idNumber] = {
                    name: name,
                    phoneNumber: phoneNumber,
                    province: province,
                    district: district,
                    city: city,
                    area: area,
                    distributorId: distributorId,
                    distributorName: distributorName,
                    distributorPhone: distributorPhone,
                    status: status,
                    orderDate: orderDate
                };
            }
        });

        console.log('تم تحميل البيانات بنجاح.');
    } catch (error) {
        console.error('حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// الرد عند بدء المحادثة
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "مرحبًا! أدخل رقم الهوية للحصول على التفاصيل.");
});

// الرد عند استقبال رسالة
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const idNumber = msg.text.trim();  // أخذ رقم الهوية من رسالة المستخدم

    if (idNumber === '/start') return; // تجاهل أمر /start

    const user = data[idNumber];
    if (user) {
        // إرسال التفاصيل بناءً على رقم الهوية
        const response = `
الاسم: ${user.name}
الحي / المنطقة: ${user.area}
هوية الموزع: ${user.distributorId}
اسم الموزع: ${user.distributorName}
رقم جوال الموزع: ${user.distributorPhone}
        `;
        bot.sendMessage(chatId, response);
    } else {
        bot.sendMessage(chatId, "عذرًا، لم أتمكن من العثور على بيانات لرقم الهوية المدخل.");
    }
});

// بدء السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
