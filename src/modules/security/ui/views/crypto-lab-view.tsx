"use client";

import { useState } from "react";
import {
    Copy,
    Hash,
    KeyRound,
    Lock,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RsaKeyPairState = {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
} | null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function base64ToBytes(value: string) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array) {
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function sha256Bytes(value: string) {
    return new Uint8Array(
        await crypto.subtle.digest("SHA-256", encoder.encode(value))
    );
}

async function deriveAesKey(passphrase: string) {
    const hash = await sha256Bytes(passphrase);
    return crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
        "encrypt",
        "decrypt",
    ]);
}

async function importHmacKey(passphrase: string) {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
}

export const CryptoLabView = () => {
    const [message, setMessage] = useState(
        "Cryptography and Network Security"
    );
    const [passphrase, setPassphrase] = useState("cns-lab-key");
    const [aesCiphertext, setAesCiphertext] = useState("");
    const [aesPlaintext, setAesPlaintext] = useState("");
    const [shaDigest, setShaDigest] = useState("");
    const [hmacDigest, setHmacDigest] = useState("");
    const [rsaKeyPair, setRsaKeyPair] = useState<RsaKeyPairState>(null);
    const [rsaSignature, setRsaSignature] = useState("");
    const [rsaStatus, setRsaStatus] = useState(
        "Generate an RSA key pair to start signing messages."
    );
    const [status, setStatus] = useState("Ready for CNS demo operations.");

    const copyToClipboard = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setStatus("Copied output to clipboard.");
    };

    const runHash = async () => {
        const digest = await sha256Bytes(message);
        setShaDigest(bytesToHex(digest));
        setStatus("Computed SHA-256 hash for the message.");
    };

    const runEncrypt = async () => {
        const key = await deriveAesKey(passphrase);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoder.encode(message)
        );
        const payload = `${bytesToBase64(iv)}.${bytesToBase64(
            new Uint8Array(ciphertext)
        )}`;
        setAesCiphertext(payload);
        setStatus("Encrypted the message with AES-GCM.");
    };

    const runDecrypt = async () => {
        if (!aesCiphertext.includes(".")) {
            setStatus("Run encryption first so a valid payload exists.");
            return;
        }

        const [ivPart, ciphertextPart] = aesCiphertext.split(".");
        const key = await deriveAesKey(passphrase);
        const plaintext = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: base64ToBytes(ivPart) },
            key,
            base64ToBytes(ciphertextPart)
        );

        setAesPlaintext(decoder.decode(plaintext));
        setStatus("Decrypted the AES-GCM payload successfully.");
    };

    const runHmac = async () => {
        const key = await importHmacKey(passphrase);
        const mac = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(message)
        );
        setHmacDigest(bytesToHex(new Uint8Array(mac)));
        setStatus("Computed an HMAC for message integrity.");
    };

    const generateRsaKeys = async () => {
        const keys = (await crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        )) as CryptoKeyPair;

        setRsaKeyPair({
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
        });
        setRsaSignature("");
        setRsaStatus("RSA key pair generated. You can now sign and verify.");
        setStatus("Generated a fresh RSA key pair.");
    };

    const signWithRsa = async () => {
        if (!rsaKeyPair) {
            setRsaStatus("Generate an RSA key pair first.");
            return;
        }

        const signature = await crypto.subtle.sign(
            { name: "RSA-PSS", saltLength: 32 },
            rsaKeyPair.privateKey,
            encoder.encode(message)
        );
        setRsaSignature(bytesToBase64(new Uint8Array(signature)));
        setRsaStatus("Signed the message with RSA-PSS.");
        setStatus("Created an RSA signature.");
    };

    const verifyRsaSignature = async () => {
        if (!rsaKeyPair || !rsaSignature) {
            setRsaStatus("Generate a key pair and sign the message first.");
            return;
        }

        const verified = await crypto.subtle.verify(
            { name: "RSA-PSS", saltLength: 32 },
            rsaKeyPair.publicKey,
            base64ToBytes(rsaSignature),
            encoder.encode(message)
        );

        setRsaStatus(
            verified
                ? "Signature verified. The message is authentic and intact."
                : "Signature verification failed. The data may be tampered with."
        );
        setStatus("Checked the RSA signature.");
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/40 px-4 py-6 md:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="gap-2 px-3 py-1">
                                <ShieldCheck className="size-3.5" />
                                CNS Feature Demo
                            </Badge>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                    Crypto Lab
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                                    Use this page to demonstrate actual
                                    cryptography concepts in the project:
                                    confidentiality with AES-GCM, integrity with
                                    HMAC, hashing with SHA-256, and digital
                                    signatures with RSA-PSS.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">Current status</p>
                            <p className="mt-1">{status}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Hash className="size-5" />
                                Message input
                            </CardTitle>
                            <CardDescription>
                                One text box drives all crypto operations so you
                                can demo the workflow quickly in viva.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="message">Plaintext</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    className="min-h-32"
                                    placeholder="Type the message you want to encrypt, hash, or sign"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passphrase">Shared secret / passphrase</Label>
                                <Input
                                    id="passphrase"
                                    value={passphrase}
                                    onChange={(event) => setPassphrase(event.target.value)}
                                    placeholder="Enter a passphrase for AES and HMAC"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={runHash} variant="secondary">
                                    <Hash className="size-4" />
                                    SHA-256 Hash
                                </Button>
                                <Button onClick={runEncrypt}>
                                    <Lock className="size-4" />
                                    AES Encrypt
                                </Button>
                                <Button onClick={runDecrypt} variant="outline">
                                    <RefreshCcw className="size-4" />
                                    AES Decrypt
                                </Button>
                                <Button onClick={runHmac} variant="secondary">
                                    <KeyRound className="size-4" />
                                    HMAC
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Syllabus mapping</CardTitle>
                            <CardDescription>
                                This page maps directly to the CNS units you
                                asked about.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm text-muted-foreground">
                            <div className="rounded-2xl border p-4">
                                <p className="font-medium text-foreground">Unit III</p>
                                <p className="mt-1">
                                    Public key cryptography via RSA key
                                    generation, signing, and verification.
                                </p>
                            </div>
                            <div className="rounded-2xl border p-4">
                                <p className="font-medium text-foreground">Unit IV</p>
                                <p className="mt-1">
                                    Message authentication using HMAC and
                                    integrity checks.
                                </p>
                            </div>
                            <div className="rounded-2xl border p-4">
                                <p className="font-medium text-foreground">Unit V</p>
                                <p className="mt-1">
                                    Secure communication and authenticated
                                    access to the crypto lab itself.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>SHA-256 digest</CardTitle>
                            <CardDescription>
                                Integrity check for the current plaintext.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea readOnly value={shaDigest} placeholder="Hash output will appear here" />
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(shaDigest)}
                                disabled={!shaDigest}
                            >
                                <Copy className="size-4" />
                                Copy hash
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>AES-GCM ciphertext</CardTitle>
                            <CardDescription>
                                Confidentiality demo using a passphrase-derived
                                key.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea readOnly value={aesCiphertext} placeholder="Encrypted payload will appear here" />
                            <Textarea readOnly value={aesPlaintext} placeholder="Decrypted plaintext will appear here" />
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(aesCiphertext)}
                                disabled={!aesCiphertext}
                            >
                                <Copy className="size-4" />
                                Copy ciphertext
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>HMAC output</CardTitle>
                            <CardDescription>
                                Message authentication code for tamper detection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea readOnly value={hmacDigest} placeholder="HMAC output will appear here" />
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(hmacDigest)}
                                disabled={!hmacDigest}
                            >
                                <Copy className="size-4" />
                                Copy HMAC
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>RSA-PSS digital signature</CardTitle>
                            <CardDescription>
                                A public/private key demo for signing and
                                verification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={generateRsaKeys} variant="secondary">
                                    Generate keys
                                </Button>
                                <Button onClick={signWithRsa}>Sign message</Button>
                                <Button onClick={verifyRsaSignature} variant="outline">
                                    Verify signature
                                </Button>
                            </div>
                            <Textarea readOnly value={rsaSignature} placeholder="RSA signature will appear here" />
                            <p className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                {rsaStatus}
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
};