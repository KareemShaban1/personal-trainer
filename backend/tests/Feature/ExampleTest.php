<?php

it('returns a successful health response', function () {
    $response = $this->get('/up');

    $response->assertOk();
});
