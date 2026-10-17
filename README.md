<div align="center">

<img src="docs/banner.svg" alt="Tan Akrthum — Portfolio" width="100%">

<br>

<a href="https://web-tan-portfolio.vercel.app"><img src="https://img.shields.io/badge/Website-web--tan--portfolio.vercel.app-38bdf8?style=flat-square&labelColor=070b18" alt="Website"></a>
<img src="https://img.shields.io/badge/HTML5-e34f26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
<img src="https://img.shields.io/badge/CSS3-1572b6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
<img src="https://img.shields.io/badge/JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">

</div>

## Overview

เว็บไซต์แฟ้มผลงานส่วนบุคคล นำเสนอประวัติการทำงาน การศึกษา ทักษะด้านเทคโนโลยีและภาษา รวมถึงผลงานและใบประกาศนียบัตร ในรูปแบบหน้าเดียว (single page) รองรับทั้งคอมพิวเตอร์และโทรศัพท์มือถือ

*A single-page personal portfolio presenting professional experience, education, technical and language skills, projects and certificates.*

<table>
<tr>
<td width="72%"><img src="docs/screenshot.png" alt="Portfolio — desktop"></td>
<td width="28%"><img src="docs/screenshot-phone.png" alt="Portfolio — mobile"></td>
</tr>
<tr><td align="center"><sub>หน้าจอคอมพิวเตอร์</sub></td><td align="center"><sub>หน้าจอโทรศัพท์มือถือ</sub></td></tr>
</table>

## Sections

| Section | Content |
|---|---|
| Home | บทนำ รูปโปรไฟล์ และสถิติประสบการณ์ |
| About | ข้อมูลส่วนตัวและเป้าหมายในสายอาชีพ |
| Experience | ประวัติการทำงาน |
| Education | ประวัติการศึกษา |
| Skills & Language | ทักษะด้านเทคโนโลยีและภาษา |
| Works & Performance | ผลงานและโปรเจกต์ พร้อมรายละเอียดแต่ละรายการ |
| Gallery | ใบประกาศนียบัตรและภาพผลงาน |
| Contact | ช่องทางติดต่อและเอกสาร CV (PDF) |

## Selected Projects

| Project | Description |
|---|---|
| [Gold Signal](https://github.com/tanakrthum254614-max/gold-signal) | แพลตฟอร์มสัญญาณการซื้อขายทองคำแบบเรียลไทม์ พร้อมผลทดสอบย้อนหลังและการเปิดเผยผลการซื้อขายจริง |
| [IT Asset Tracker](https://github.com/tanakrthum254614-max/it-asset-tracker) | ระบบทะเบียนครุภัณฑ์ไอทีพร้อมป้าย QR และการติดตามการรับประกัน |
| [IT Expiry Alert](https://github.com/tanakrthum254614-max/it-expiry-alert) | ระบบแจ้งเตือนก่อนใบรับรอง SSL โดเมน ลิขสิทธิ์ และสัญญาหมดอายุ |
| [IT Runbook](https://github.com/tanakrthum254614-max/it-runbook) | ศูนย์รวมขั้นตอนแก้ไขปัญหาไอทีเบื้องต้นสำหรับผู้ใช้งาน |

## Project Structure

```
├── index.html        หน้าเว็บหลัก (HTML · CSS · JavaScript)
├── Portfolio.html    สำเนาหน้าเว็บหลัก (รักษาให้ตรงกัน)
├── api/              Serverless functions สำหรับแกลเลอรี
├── data/ · images/   ข้อมูลและรูปภาพผลงาน / ใบประกาศนียบัตร
└── TAN_AKRTHUM.pdf   เอกสาร CV
```

## Development

```bash
npx serve .      # หรือเปิดไฟล์ index.html ในเบราว์เซอร์โดยตรง
```

การ push ไปยัง branch `main` จะ deploy ไปยัง Vercel โดยอัตโนมัติ

---

<div align="center"><sub>© 2569 Tan Akrthum · Bangkok, Thailand</sub></div>
