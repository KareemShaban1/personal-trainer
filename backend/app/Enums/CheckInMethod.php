<?php

namespace App\Enums;

enum CheckInMethod: string
{
    case Manual = 'manual';
    case QrScan = 'qr_scan';
    case SelfCheckIn = 'self_check_in';
}
