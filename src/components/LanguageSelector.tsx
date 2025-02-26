"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Complete list of supported languages from Lemonfox API
const languages = [
  { code: "indonesian", name: "Indonesian" },
  { code: "english", name: "English" },
  { code: "chinese", name: "Chinese" },
  { code: "german", name: "German" },
  { code: "spanish", name: "Spanish" },
  { code: "russian", name: "Russian" },
  { code: "korean", name: "Korean" },
  { code: "french", name: "French" },
  { code: "japanese", name: "Japanese" },
  { code: "portuguese", name: "Portuguese" },
  { code: "turkish", name: "Turkish" },
  { code: "polish", name: "Polish" },
  { code: "catalan", name: "Catalan" },
  { code: "dutch", name: "Dutch" },
  { code: "arabic", name: "Arabic" },
  { code: "swedish", name: "Swedish" },
  { code: "italian", name: "Italian" },
  { code: "hindi", name: "Hindi" },
  { code: "finnish", name: "Finnish" },
  { code: "vietnamese", name: "Vietnamese" },
  { code: "hebrew", name: "Hebrew" },
  { code: "ukrainian", name: "Ukrainian" },
  { code: "greek", name: "Greek" },
  { code: "malay", name: "Malay" },
  { code: "czech", name: "Czech" },
  { code: "romanian", name: "Romanian" },
  { code: "danish", name: "Danish" },
  { code: "hungarian", name: "Hungarian" },
  { code: "tamil", name: "Tamil" },
  { code: "norwegian", name: "Norwegian" },
  { code: "thai", name: "Thai" },
  { code: "urdu", name: "Urdu" },
  { code: "croatian", name: "Croatian" },
  { code: "bulgarian", name: "Bulgarian" },
  { code: "lithuanian", name: "Lithuanian" },
  { code: "latin", name: "Latin" },
  { code: "maori", name: "Maori" },
  { code: "malayalam", name: "Malayalam" },
  { code: "welsh", name: "Welsh" },
  { code: "slovak", name: "Slovak" },
  { code: "telugu", name: "Telugu" },
  { code: "persian", name: "Persian" },
  { code: "latvian", name: "Latvian" },
  { code: "bengali", name: "Bengali" },
  { code: "serbian", name: "Serbian" },
  { code: "azerbaijani", name: "Azerbaijani" },
  { code: "slovenian", name: "Slovenian" },
  { code: "kannada", name: "Kannada" },
  { code: "estonian", name: "Estonian" },
  { code: "macedonian", name: "Macedonian" },
  { code: "breton", name: "Breton" },
  { code: "basque", name: "Basque" },
  { code: "icelandic", name: "Icelandic" },
  { code: "armenian", name: "Armenian" },
  { code: "nepali", name: "Nepali" },
  { code: "mongolian", name: "Mongolian" },
  { code: "bosnian", name: "Bosnian" },
  { code: "kazakh", name: "Kazakh" },
  { code: "albanian", name: "Albanian" },
  { code: "swahili", name: "Swahili" },
  { code: "galician", name: "Galician" },
  { code: "marathi", name: "Marathi" },
  { code: "punjabi", name: "Punjabi" },
  { code: "sinhala", name: "Sinhala" },
  { code: "khmer", name: "Khmer" },
  { code: "shona", name: "Shona" },
  { code: "yoruba", name: "Yoruba" },
  { code: "somali", name: "Somali" },
  { code: "afrikaans", name: "Afrikaans" },
  { code: "occitan", name: "Occitan" },
  { code: "georgian", name: "Georgian" },
  { code: "belarusian", name: "Belarusian" },
  { code: "tajik", name: "Tajik" },
  { code: "sindhi", name: "Sindhi" },
  { code: "gujarati", name: "Gujarati" },
  { code: "amharic", name: "Amharic" },
  { code: "yiddish", name: "Yiddish" },
  { code: "lao", name: "Lao" },
  { code: "uzbek", name: "Uzbek" },
  { code: "faroese", name: "Faroese" },
  { code: "haitian creole", name: "Haitian Creole" },
  { code: "pashto", name: "Pashto" },
  { code: "turkmen", name: "Turkmen" },
  { code: "nynorsk", name: "Nynorsk" },
  { code: "maltese", name: "Maltese" },
  { code: "sanskrit", name: "Sanskrit" },
  { code: "luxembourgish", name: "Luxembourgish" },
  { code: "myanmar", name: "Myanmar" },
  { code: "tibetan", name: "Tibetan" },
  { code: "tagalog", name: "Tagalog" },
  { code: "malagasy", name: "Malagasy" },
  { code: "assamese", name: "Assamese" },
  { code: "tatar", name: "Tatar" },
  { code: "hawaiian", name: "Hawaiian" },
  { code: "lingala", name: "Lingala" },
  { code: "hausa", name: "Hausa" },
  { code: "bashkir", name: "Bashkir" },
  { code: "javanese", name: "Javanese" },
  { code: "sundanese", name: "Sundanese" },
  { code: "cantonese", name: "Cantonese" },
  { code: "burmese", name: "Burmese" },
  { code: "valencian", name: "Valencian" },
  { code: "flemish", name: "Flemish" },
  { code: "haitian", name: "Haitian" },
  { code: "letzeburgesch", name: "Letzeburgesch" },
  { code: "pushto", name: "Pushto" },
  { code: "panjabi", name: "Panjabi" },
  { code: "moldavian", name: "Moldavian" },
  { code: "moldovan", name: "Moldovan" },
  { code: "sinhalese", name: "Sinhalese" },
  { code: "castilian", name: "Castilian" },
  { code: "mandarin", name: "Mandarin" },
].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
}

export default function LanguageSelector({
  onLanguageChange,
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("indonesian");

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    onLanguageChange(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="language-select"
        className="text-sm font-medium text-gray-300"
      >
        Select Language
      </label>
      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger
          id="language-select"
          className="w-full border-[#2A3045] bg-[#1A1F2E] text-gray-200"
        >
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
