<?php

namespace App\Enums;

enum NoteVisibility: string
{
    case Internal = 'internal';
    case SharedWithParent = 'shared_with_parent';
    case Private = 'private';
}
