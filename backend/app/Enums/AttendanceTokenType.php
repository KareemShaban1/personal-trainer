<?php

namespace App\Enums;

enum AttendanceTokenType: string
{
    case TraineeOpaque = 'trainee_opaque';
    case OrgCheckIn = 'org_check_in';
}
