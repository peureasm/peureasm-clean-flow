"use client";

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DAUM_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const SCRIPT_LOAD_ERROR = '\uC8FC\uC18C \uAC80\uC0C9 \uC2A4\uD06C\uB9BD\uD2B8\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';

let daumPostcodeLoader: Promise<void> | null = null;

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          roadAddress: string;
          jibunAddress: string;
          zonecode: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (daumPostcodeLoader) {
    return daumPostcodeLoader;
  }

  daumPostcodeLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${DAUM_POSTCODE_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(SCRIPT_LOAD_ERROR)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = DAUM_POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(SCRIPT_LOAD_ERROR));
    document.head.appendChild(script);
  });

  return daumPostcodeLoader;
}

interface AddressSearchFieldProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  addressPlaceholder?: string;
  detailPlaceholder?: string;
  searchButtonLabel?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export default function AddressSearchField({
  name,
  defaultValue = '',
  required = false,
  disabled = false,
  addressPlaceholder = '\uC8FC\uC18C \uCC3E\uAE30\uB97C \uB20C\uB7EC \uC8FC\uC18C\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.',
  detailPlaceholder = '\uC0C1\uC138 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694. \uC608: 3\uCE35 \uC6D0\uBB34\uACFC',
  searchButtonLabel = '\uC8FC\uC18C \uCC3E\uAE30',
  className,
  onValueChange,
}: AddressSearchFieldProps) {
  const [selectedAddress, setSelectedAddress] = useState(defaultValue);
  const [detailAddress, setDetailAddress] = useState('');
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSelectedAddress(defaultValue);
    setDetailAddress('');
  }, [defaultValue]);

  const combinedAddress = useMemo(() => {
    return [selectedAddress.trim(), detailAddress.trim()].filter(Boolean).join(' ');
  }, [detailAddress, selectedAddress]);

  useEffect(() => {
    onValueChange?.(combinedAddress);
  }, [combinedAddress, onValueChange]);

  const handleSearchAddress = async () => {
    try {
      setErrorMessage('');
      setIsLoadingScript(true);
      await loadDaumPostcodeScript();

      if (!window.daum?.Postcode) {
        throw new Error('\uC8FC\uC18C \uAC80\uC0C9 \uC11C\uBE44\uC2A4\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          const nextAddress = data.roadAddress || data.jibunAddress || data.address;
          setSelectedAddress(nextAddress);
        },
      }).open();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '\uC8FC\uC18C \uAC80\uC0C9\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'
      );
    } finally {
      setIsLoadingScript(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <Input
            value={selectedAddress}
            readOnly
            required={required}
            disabled={disabled}
            placeholder={addressPlaceholder}
            className="h-12 rounded-xl border-none bg-slate-50 pl-10 font-bold"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-slate-200 px-4 font-bold"
          onClick={() => void handleSearchAddress()}
          disabled={disabled || isLoadingScript}
        >
          <Search className="mr-2 h-4 w-4" />
          {isLoadingScript ? '\uBD88\uB7EC\uC624\uB294 \uC911...' : searchButtonLabel}
        </Button>
      </div>

      <Input
        value={detailAddress}
        disabled={disabled}
        placeholder={detailPlaceholder}
        onChange={(event) => setDetailAddress(event.target.value)}
        className="h-12 rounded-xl border-none bg-slate-50 font-medium"
      />

      {errorMessage ? <p className="text-xs font-medium text-destructive">{errorMessage}</p> : null}

      <input type="hidden" name={name} value={combinedAddress} readOnly />
    </div>
  );
}
