<?php

use App\Enums\Role;
use App\Support\CurrentOrganization;

beforeEach(function () {
    seedRoles();
});

it('allows a parent to view their linked child trainee', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $child = createTraineeUser($org)['trainee'];
    $parentData = createParentWithChild($org, $child);

    CurrentOrganization::set($org->id);

    $response = $this->withHeaders(authHeaders($parentData['user'], $org))
        ->getJson('/api/trainees/'.$child->id);

    $response->assertOk()
        ->assertJsonPath('trainee.id', $child->id);
});

it('denies a parent access to an unrelated trainee', function () {
    $org = createOrganization();
    createStaffUser($org);
    $child = createTraineeUser($org)['trainee'];
    $other = createTraineeUser($org)['trainee'];
    $parentData = createParentWithChild($org, $child);

    CurrentOrganization::set($org->id);

    $response = $this->withHeaders(authHeaders($parentData['user'], $org))
        ->getJson('/api/trainees/'.$other->id);

    $response->assertForbidden();
});
