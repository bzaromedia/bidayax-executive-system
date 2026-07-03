alter type interaction_event_type add value if not exists 'qr_transfer_detected';
alter type interaction_event_type add value if not exists 'qr_transfer_success_feedback';
alter type interaction_event_type add value if not exists 'qr_transfer_failure_feedback';
alter type interaction_event_type add value if not exists 'qr_transfer_haptics_toggled';
alter type interaction_event_type add value if not exists 'qr_transfer_sound_toggled';
alter type interaction_event_type add value if not exists 'qr_transfer_animation_toggled';