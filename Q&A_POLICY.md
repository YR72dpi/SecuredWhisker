# ❓ Q&A Policy – SecuredWhisker

## 🧭 Purpose & Scope

This policy governs **technical questions & answers** related to the **SecuredWhisker** project, a secure Go API for secrets management. It is intended for:
- Users (DevOps, backend developers, pentesters, etc.)
- Contributors wishing to help or improve the project
- Curious individuals exploring the Go stack / security

The scope covers:
- **Bugs**, unexpected behaviors, or build issues
- **Usage questions** (configuration, integration, security)
- **Feature ideas**, if technically justified
- **Real-world feedback** (production use, audits, etc.)

## 🛠️ Tools Used & Justification

- **GitHub Issues**  
  📌 Recommended for bugs, technical questions, reproducible problems  
  ✔️ Integrated into the development cycle (linked commits/PRs)

- **GitHub Discussions** (if enabled)  
  💬 Ideal for open debates, brainstorming, user feedback

These tools are **aligned with the GitHub stack** used for development, promote history and visibility, and allow other users to react or contribute.

## 🧪 Success Criteria (KPIs)

For this Q&A Policy to be considered effective, we rely on the following indicators:
- At least **90% of questions** receive a first response **within 48 business hours**
- **100% of reported bugs** are either **reproducible** or **documented in an actionable way**
- At least **70% of "question" issues** are **closed** with a solution, improved documentation, or an associated Pull Request
- **No cases of spam or disrespectful behavior** are tolerated; any violation results in immediate moderation

## ✅ Example of a well-formulated question:

**Title**  
Error `tls: handshake failure` during build with Go 1.21 on Ubuntu 22.04

**Detailed description**  
Hello,  
I encounter an error when compiling the project on an Ubuntu 22.04 machine with Go 1.21. Here are the steps followed and the error message obtained:

**Steps to reproduce**
```bash
go version go1.21 linux/amd64
git clone https://github.com/YR72dpi/SecuredWhisker
cd SecuredWhisker
go build ./...
```

**Expected result**  
The build should complete without error.

**Actual result**  
The build fails with the following message:
```
tls: handshake failure
```

**Additional information**
- OS: Ubuntu 22.04 LTS (up to date)
- Go version: 1.21
- Internet connection behind a proxy: No
- I tried disabling my firewall, without success.

**Attempts already made**
- Cleaned Go cache (`go clean -modcache`)
- Retried build after reboot

**Question**  
Has anyone encountered this issue? Is there a specific configuration required for Go 1.21