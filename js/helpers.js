//helper functions
function getSegmentWidth(numOfSegments, radius) {
    var angle = angleToRadians(360 / numOfSegments);
    return 2 * radius * Math.sin(angle/2);
}

function angleToRadians(angle) {
    return angle * Math.PI / 180;
}

function getDistanceToSegment(numOfSegments, radius) {
    var angle = angleToRadians(360 / numOfSegments);
    return radius * Math.cos(angle/2);
}
